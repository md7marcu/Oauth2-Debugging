import { Request, Response } from "express";
import { config } from "node-config-ts";
import { findIndex, difference } from "lodash";
import { Guid } from "guid-typescript";
import * as buildUrl from "build-url";
import * as Debug from "debug";
const debug = Debug("AuthRoute");
import * as Fs from "fs";
import { sign, VerifyOptions } from "jsonwebtoken";
import * as path from "path";

interface IRequest extends Request {
    clientId: string;
}
interface IVerifyOptions extends VerifyOptions {
    iss: string;
    aud: string;
}
export class AuthRoutes {

    public routes(app): void {
        let db = app.Db;

        app.get("/", async(req: IRequest, res: Response) => {
            res.render("index",
            {
                title: "Authorization Server",
                endpoints: {
                    authorizationEndpoint: config.authorizationEndpoint,
                    accessTokenEndpoint: config.accessTokenEndpoint,
                    aliveEndpoint: config.aliveEndpoint,
                },
            });
        });

        app.get("/testPug", async(req: IRequest, res: Response) => {
            res.render("allowRequest",
            {
                title: "Authorization Server",
                client: db.getClient(config.clients[0].clientId),
                requestId: "43",
            });
        });

        app.get("/alive", async(req: IRequest, res: Response) => {
            res.send("Success!");
        });

        app.get("/authorize", async(req: Request, res: Response) => {
             // 1. Verify ClientId
            let client = db.getClient(((req?.query?.clientId ?? "") as string));

            if (config.verifyClientId && !client) {
                res.render("authError",
                {
                    title: "Authorization Errors",
                    error: "Unknown Client Id.",
                });

                return;
            }

            // 2. Verify Redirect URL
            let redirectUrl = (req?.query?.redirectUri ?? "").toString();
            let invalidRedirectUri = findIndex(client?.redirectUris ?? "", (r) => { return r === redirectUrl;}) < 0;

            if (config.verifyRedirectUrl && invalidRedirectUri) {
                res.render("authError",
                {
                    title: "Authorization Errors",
                    error: "Invalid Redirect URL.",
                });

                return;
            }

            // 3. Verify Scope/s
            let queryScopes = ((req?.query?.scopes ?? "") as string).split(" ");
            let invalidScopes = this.verifyScope(queryScopes, client.scopes);

            if (config.validateScope && invalidScopes) {
                res.redirect(
                    buildUrl(redirectUrl,
                    {
                        queryParams: { error: "Invalid Scope."},
                    }));

                return;
            }

            // 4. Create RequestId and store the request (if request should be validated...)
            let requestId = Guid.create();
            db.saveRequest(Guid.create(), req?.query);

            // 5. Serve page and let user approve authorization
            res.render("allowRequest", { client: client, requestId: requestId.toString(), scopes: queryScopes});
        });

        app.post("/allowRequest", async(req: Request, res: Response) => {
            let query;
            let requestId;

            if(Guid.isGuid(req?.body?.requestId?.value ?? "")) {
                requestId = Guid.parse(req?.body?.requestId?.value ?? "");
                query = db.getRequest(requestId);
            }

            // Delete request id - mitigate replay
            if (config.clearRequestId) {
                db.deleteRequest(requestId);
            }
            if (!query) {
                res.render("authError",
                {
                    title: "Authorization Errors",
                    error: "Could not find authorization request.",
                });

                return;
            }

            // If the user allowed the request
            if (req.body.allowed) {

                // Authorization code request
                if (query.responseType === "code") {
                    // Verify scopes - should be the same as the clients scope
                    let selectedScopes = [""]; // Get scopes from req.body "#{scope}"
                    let client = db.getClient(query.clientId);
                    let validScopes = this.verifyScope(selectedScopes, client.scopes);

                    if (!validScopes) {
                        let url = buildUrl(query.redirectUri, { queryParams: { error: "Invalid Scope"}});
                        res.redirect(url);

                        return;
                    }

                    // Create the authorization code and save it with the request
                    let codeId = this.getRandomString(config.authorizationCodeLength);
                    db.saveAuthorizationCode(codeId, { request: query, scopes: selectedScopes});

                    let queryParams: any;

                    if (config.verifyState) {
                        queryParams = {
                                queryParams: {
                                    state: query.state,
                                    code: codeId,
                                },
                            };
                    } else {
                        queryParams = {queryParams: { code: codeId }};
                    }
                    // Send the results back to the client
                    res.redirect(buildUrl(query.redirectUri, queryParams));

                    return;
                } else {
                    res.redirect(buildUrl(query.redirectUri, { queryParams: { error: "Invalid response type"}}));

                    return;
                    }
            } else {
                let url = buildUrl(query.redirectUri, { queryParams: { error: "Access Denied."}});
                res.redirect(url);

                return;
            }
        });

        app.post("/token", async(req: Request, res: Response) => {
            let clientId: string;
            let clientSecret: string;

            if (req.body.clientId && req.body.clientSecret) {
                clientId = req.body.clientId;
                clientSecret = req.body.clientSecret;
            } else {
                // TODO: Check header for clientId and secret? Check standard if that is in fact valid
                debug(`Client id or secret are invalid ${req.body.clientId}/${req.body.clientSecret}`);
                res.status(401).send("Client Id and/or Client Secret.");

                return;
            }

            let client = db.getClient(clientId);

            if (!client) {
                debug(`Could not find client: ${clientId}`);
                res.status(401).send("Invalid client.");

                return;
            }
            if (client.clientSecret !== clientSecret) {
                debug(`Invalid client secret: ${clientSecret}`);
                res.status(401).send("Invalid client secret.");

                return;
            }

            // 2. authorizationCode request =>
            if (req.body?.grantType === config.authorizationCodeGrant) {

                // fresh or replayed token
                if (config.verifyCode && !db.validAuthorizationCode(req.body.authorizationCode)) {
                    debug(`Authorization Code is invalid: ${req.body.authorizationCode}`);
                    res.status(401).send("Invalid code.");

                    return;
                }

                let authorizationCode = db.getAuthorizationCode(req.body.authorizationCode);

                if (authorizationCode) {
                    // remove code so it cannot be reused
                    if (config.clearAuthorizationCode) {
                        db.deleteAuthorizationCode(req.body.authorizationCode);
                    }

                    if (config.verifyClientId && authorizationCode.request.clientId === clientId) {
                        let payload = this.buildAccessToken(authorizationCode.scopes);
                        let accessToken = this.signAccessToken(payload);

                        if (config.saveAccessToken) {
                            db.saveAccessToken({accessToken: accessToken, clientId: clientId});
                        }
                        let refreshToken = this.getRandomString(config.refreshTokenLength);
                        db.saveRefreshToken(refreshToken, clientId, authorizationCode.scopes);
                        res.status(200).send({accessToken: accessToken, refreshToken: refreshToken });

                        return;
                    } else {
                        debug(`Client id does not match stored client id: ${authorizationCode.request.clientId}/${clientId}`);
                        res.status(400).send("Invalid grant.");

                        return;
                    }
                } else {
                    debug(`Could not find code in storage ${authorizationCode}`)
                    res.status(400).send("Invalid grant.");

                return;
            }
            } else if (req.body.grantType === config.refreshTokenGrant) {

                // Check if we have the refresh token, i.e. valid refresh token
                let refreshToken = db.getRefreshToken(req?.body?.refreshToken ?? "");

                if (refreshToken) {
                    debug("Verified refresh token.");

                    // TODO: The way this is setup, we wouldn't really be able to do anything with this
                    // Another valid clientId <= might be able to do it, VERIFY
                    if (config.verifyClientId && refreshToken.clientId !== clientId) {
                         debug("Client mismatch on refresh token.");
                         res.status(400).send("Invalid refresh token.");

                        return;
                    }
                    let payload = this.buildAccessToken(refreshToken.scopes);
                    let accessToken = this.signAccessToken(payload);

                    if (config.saveAccessToken) {
                        db.saveAccessToken(accessToken, clientId);
                    }
                    res.status(200).send({accessToken: accessToken, refreshToken: refreshToken });
                } else {
                    debug("Called with invalid refresh token");
                    res.status(400).send("Invalid Code.");

                    return;
                }
            } else {
                debug("Called with invalid grant.");
                res.status(400).send("Invalid Grant.");

                return;
            }

            res.status(200).send();
        });
    }

    // Verify that the client has all scopes that's asked for
    verifyScope(askedScopes: string[], clientScopes: [string]): boolean {
       return difference(askedScopes, clientScopes).length > 0;
    }

    getRandomString(tokenLength: number): string {
        // tslint:disable-next-line:no-bitwise
        return [...Array(tokenLength)].map(i => (~~(Math.random() * 36)).toString(36)).join("");
    }

    buildAccessToken(scopes) {
        let payload = {
            iss: config.issuer,
            aud: config.audience,
            sub: config.subject,
            exp: Math.floor(Date.now() / 1000) + config.expiryTime,
            iat: Math.floor(Date.now() / 1000) - config.createdTimeAgo,
            scope: scopes,
        };

        if (config.addNonceToToken) {
            (payload as any).jti = this.getRandomString(16);
        }

        return payload;
    }

    signAccessToken(options: IVerifyOptions): string {
        return sign(options, Fs.readFileSync(path.join(__dirname, "../../config/key.pem")), { algorithm: config.algorithm });
    }
}