import { Request, Response, NextFunction } from "express";
import { config } from "node-config-ts";
import { findIndex, difference } from "lodash";
import { Guid } from "guid-typescript";
import * as buildUrl from "build-url";
import * as Debug from "debug";
const debug = Debug("AuthServer:AuthRoutes:");
import * as Fs from "fs";
import { sign } from "jsonwebtoken";
import * as path from "path";
import IClient from "interfaces/IClient";
import Db from "../db/db";
import { IVerifyOptions } from "../interfaces/IVerifyOptions";
import { IRequest } from "../interfaces/IRequest";
import getRandomString from "../helpers/GetRandomString";
import { compare } from "bcryptjs";

export class AuthRoutes {
    private db;

    public routes(app): void {
        this.db = app.Db;

        app.get("/", async(req: IRequest, res: Response) => {
            res.render("index",
            {
                title: "Authorization Server",
                endpoints: {
                    authorizationEndpoint: config.settings.authorizationEndpoint,
                    accessTokenEndpoint: config.settings.accessTokenEndpoint,
                    aliveEndpoint: config.settings.aliveEndpoint,
                },
            });
        });

        app.get("/alive", async(req: IRequest, res: Response) => {
            res.send("Success!");
        });

        app.get("/authorize", async(req: Request, res: Response) => {
             // 1. Verify ClientId
            let client: IClient = this.db.getClient(((req?.query?.client_id ?? "") as string));

            if (config.settings.verifyClientId && !client) {
                res.render("authError",
                {
                    title: "Authorization Errors",
                    error: "Unknown Client Id.",
                });
                return;
            }

            // 2. Verify Redirect URL
            let redirectUrl = (req?.query?.redirect_uri ?? "").toString();
            let invalidRedirectUri = findIndex(client?.redirectUris ?? "", (r) => { return r === redirectUrl; }) < 0;

            if (config.settings.verifyRedirectUrl && invalidRedirectUri) {
                res.render("authError",
                {
                    title: "Authorization Errors",
                    error: "Invalid Redirect URL.",
                });
                return;
            }

            // 3. Verify Scope/s
            let queryScopes = ((req?.query?.scopes ?? "") as string).split(",");
            let openIdFlow = this.openIdFlow(queryScopes);
            let invalidScopes = this.verifyScope(queryScopes, client.scopes);

            if (config.settings.validateScope && invalidScopes) {
                res.redirect(
                    buildUrl(redirectUrl,
                    {
                        queryParams: { error: "Invalid Scope."},
                    }));

                return;
            }

            // 4. Create RequestId and store the request (if request should be validated...)
            let requestId = Guid.create();
            this.db.saveRequest(requestId, req?.query);

            // 5. Serve page and let user approve authorization (and possibly authenticate)
            let renderData = { client: client, requestId: requestId.toString(), scopes: queryScopes};

            if (openIdFlow) {
                res.render("authenticate", renderData);
            } else {
                res.render("allowRequest", renderData);
            }
        });

        app.post("/allowRequest", this.openIdRequest, this.authenticateUser, async(req: Request, res: Response) => {
            let query;
            let requestId;

            if (Guid.isGuid(req?.body?.request_id ?? "")) {
                requestId = Guid.parse(req?.body?.request_id ?? "");
                query = this.db.getRequest(requestId);
            }

            // Delete request id - mitigate replay
            if (config.settings.clearRequestId) {
                this.db.deleteRequest(requestId);
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
            if (req.body.allow) {

                if (req.body.openIdRequest && !req.body.authenticated) {
                    res.render("authError",
                    {
                        title: "Authentication Error",
                        error: "Wrong credentials supplied.",
                    });
                    return;
                }

                // Authorization code request
                if (query.response_type === "code") {
                    // Verify scopes - should be the same as the clients scope
                    let selectedScopes = req.body.scopes;
                    let client: IClient = this.db.getClient(query.client_id);
                    let invalidScopes = this.verifyScope(selectedScopes, client.scopes);

                    if (config.settings.validateScope && invalidScopes) {
                        let url = buildUrl(query.redirect_uri, { queryParams: { error: "Invalid Scope"}});
                        res.redirect(url);

                        return;
                    }

                    // Create the authorization code and save it with the request
                    let codeId = getRandomString(config.settings.authorizationCodeLength);
                    this.db.saveAuthorizationCode(codeId, { request: query, scopes: selectedScopes});
                    // User is fake authenticated - update the record with seconds since EPOCH
                    this.db.updateUser(config.settings.users[0].name,  Math.round((new Date()).getTime() / 1000), codeId);

                    let queryParams: any;

                    if (config.settings.verifyState) {
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
                    res.redirect(buildUrl(query.redirect_uri, queryParams));

                    return;
                } else {
                    res.redirect(buildUrl(query.redirect_uri, { queryParams: { error: "Invalid response type"}}));

                    return;
                    }
            } else {
                let url = buildUrl(query.redirect_uri, { queryParams: { error: "Access Denied."}});
                res.redirect(url);

                return;
            }
        });

        app.post("/token", async(req: Request, res: Response) => {
            let clientId: string;
            let clientSecret: string;

            if (req.body.client_id && req.body.client_secret) {
                clientId = req.body.client_id;
                clientSecret = req.body.client_secret;
            } else {
                // TODO: Check header for clientId and secret
                // basic auth clientid:clientsecret	var headers = {
                // header "Authorization": "Basic "  + client_id ":" client_secret
                debug(`Client id or secret are invalid ${req.body.client_id}/${req.body.client_secret}`);
                res.status(401).send("Client Id/Client Secret basic auth not supported.");

                return;
            }

            let client: IClient = this.db.getClient(clientId);

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
            if (req.body?.grant_type === config.settings.authorizationCodeGrant) {

                // fresh or replayed token
                if (config.settings.verifyCode && !this.db.validAuthorizationCode(req.body.authorization_code)) {
                    debug(`Authorization Code is invalid: ${req.body.authorization_code}`);
                    res.status(401).send("Invalid code.");

                    return;
                }

                let authorizationCode = this.db.getAuthorizationCode(req.body.authorization_code);

                if (authorizationCode) {
                    // remove code so it cannot be reused
                    if (config.settings.clearAuthorizationCode) {
                        this.db.deleteAuthorizationCode(req.body.authorization_code);
                    }

                    if (config.settings.verifyClientId && authorizationCode.request.client_id === clientId) {
                        let payload = this.buildAccessToken(authorizationCode.scopes);
                        let accessToken = this.signToken(payload);
                        let openIdConnectFlow = this.isOpenIdConnectFlow(authorizationCode.request.scopes);

                        if (config.settings.saveAccessToken) {
                            this.db.saveAccessToken({accessToken: accessToken, clientId: clientId});
                        }
                        let refreshToken = getRandomString(config.settings.refreshTokenLength);
                        this.db.saveRefreshToken(refreshToken, clientId, authorizationCode.scopes);
                        let resultPayload = {access_token: accessToken, refresh_token: refreshToken };

                        if (openIdConnectFlow) {
                            (resultPayload as any).id_token = this.signToken(this.buildIdToken(req.body.authorization_code,  clientId, this.db));
                        }
                        res.status(200).send(resultPayload);

                        return;
                    } else {
                        debug(`Client id does not match stored client id: ${authorizationCode.request.client_id}/${clientId}`);
                        res.status(400).send("Invalid grant.");

                        return;
                    }
                } else {
                    debug(`Could not find code in storage ${authorizationCode}`);
                    res.status(400).send("Invalid grant.");

                return;
            }
            } else if (req.body.grant_type === config.settings.refreshTokenGrant) {

                // Check if we have the refresh token, i.e. valid refresh token
                let refreshToken = this.db.getRefreshToken(req?.body?.refresh_token ?? "");

                if (refreshToken) {
                    debug("Verified refresh token.");

                    if (config.settings.verifyClientId && refreshToken.clientId !== clientId) {
                         debug("Client mismatch on refresh token.");
                         res.status(400).send("Invalid refresh token.");

                        return;
                    }
                    let payload = this.buildAccessToken(refreshToken.scopes);
                    let accessToken = this.signToken(payload);

                    if (config.settings.saveAccessToken) {
                        this.db.saveAccessToken(accessToken, clientId);
                    }
                    res.status(200).send({access_token: accessToken, refresh_token: refreshToken.refreshToken });
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

    private authenticateUser = async(req: IRequest, res: Response, next: NextFunction): Promise<any> => {
        // Authenticate the user if this is an open id request, see disclaimer where it is set.
        if (req?.body?.openIdRequest) {
            let username = req?.body?.username;
            let user = await this.db.getUser(username);
            let password = req?.body?.password ? req?.body?.password : "";

            if (!user || password === "") {
                req.body.authenticated = false;
            } else {
                req.body.authenticated = await compare(password, user?.password);
            }
            next();
        }
        next();
    }

    // Shortcut: We're just checking if there are any user/password fields available in order
    // to decide if this is an openid request that needs authentication. In real life it would be
    // obvious when it is an authentication request.
    private openIdRequest = (req: IRequest, res: Response, next: NextFunction): any => {
        if (req?.body.username && req?.body.password) {
            req.body.openIdRequest = true;
        }
        next();
    }

    private isOpenIdConnectFlow = (scopes: string): boolean => {
        return scopes.split(",").findIndex((x) => x === "openid") > -1;
    }

    // Create an id token for OpenId Connect flow
    private buildIdToken = (authorizationCode: any, clientId: string, db: Db): IVerifyOptions => {
        let user = db.getUserFromCode(authorizationCode);

        return {
            iss: config.settings.issuer,
            sub: user.userId,
            aud: clientId,
            exp: Math.floor(Date.now() / 1000) + config.settings.expiryTime,
            iat: Math.floor(Date.now() / 1000) - config.settings.createdTimeAgo,
            auth_time: user.lastAuthenticated,
            nonce: user.nonce,
        };
    }

    private openIdFlow = (queryScopes: string[]) => {
        return queryScopes.includes("openid");
    }

    // Verify that the client has all scopes that's asked for
    private verifyScope(askedScopes: string[], clientScopes: string[]): boolean {
       return difference(askedScopes, clientScopes).length > 0;
    }

    private buildAccessToken = (scopes): IVerifyOptions => {
        let payload = {
            iss: config.settings.issuer,
            aud: config.settings.audience,
            sub: config.settings.subject,
            exp: Math.floor(Date.now() / 1000) + config.settings.expiryTime,
            iat: Math.floor(Date.now() / 1000) - config.settings.createdTimeAgo,
            scope: scopes,
        };

        if (config.settings.addNonceToToken) {
            (payload as any).jti = getRandomString(16);
        }
        return payload;
    }

    private signToken = (options: IVerifyOptions): string => {
        return sign(options, Fs.readFileSync(path.join(__dirname, "../../config/key.pem")), { algorithm: config.settings.algorithm });
    }
}