import { Request, Response } from "express";
import { config } from "node-config-ts";
import Db from "../db/Db";
import { findIndex, difference } from "lodash";
import { Guid } from "guid-typescript";
import * as buildUrl from "build-url";

interface IRequest extends Request {
    client_id: string;
}
export class AuthRoutes {

    // Refactor extract to db
    // Mock db
    private refreshTokens = {};
    private accessTokens = [];

    public routes(app): void {
        let db = app.Db;

        app.get("/", async(req: IRequest, res: Response) => {
            res.render("index",
            {
                title: "Authorization Server",
                endpoints: {
                    authorization: config.authorizationEndpoint,
                    token: config.tokenEndpoint,
                    alive: config.aliveEndpoint,
                },
            });
        });

        app.get("/testPug", async(req: IRequest, res: Response) => {
            res.render("allowRequest",
            {
                title: "Authorization Server",
                client: db.getClient(config.clients[0].client_id),
                requestId: "43",
            });
        });

        app.get("/alive", async(req: IRequest, res: Response) => {
            res.send("Success!");
        });

        app.get("/authorize", async(req: Request, res: Response) => {
             // 1. Verify ClientId
            let client = db.getClient(((req?.query?.client_id ?? "") as string));

            if (config.verifyClientId && !client) {
                res.render("authError",
                {
                    title: "Authorization Errors",
                    error: "Unknown Client Id.",
                });

                return;
            }

            // 2. Verify Redirect URL
            let redirectUrl = (req?.query?.redirect_uri ?? "").toString();
            let invalidRedirectUri = findIndex(client?.redirect_uris ?? "", (r) => { return r === redirectUrl;}) < 0;

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

                // Code request
                if (query.response_type === "code") {
                    // Verify scopes - should be the same as the clients scope
                    let selectedScopes = [""]; // Get scopes from req.body "#{scope}"
                    let client = db.getClient(query.client_id);
                    let validScopes = this.verifyScope(selectedScopes, client.scopes);

                    if (!validScopes) {
                        let url = buildUrl(query.redirect_uri, { queryParams: { error: "Invalid Scope"}});
                        res.redirect(url);

                        return;
                    }

                    // Create the code and save it with the request
                    let codeId = this.getRandomString(config.tokenLength);
                    db.saveCode(codeId, { request: query, scopes: selectedScopes});

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
            // tslint:disable-next-line:no-string-literal
            let jwt = req.headers["authorization"];
            let clientId: string;
            let clientSecret: string;

            // 1. if valid authorization header grab client id and secrets - or grab it from body
            if (jwt) {
                let clientHeader = jwt.slice("basic ".length).split(":");
                clientId = decodeURI(clientHeader[0]);
                clientSecret = decodeURI(clientHeader[1]);
            } else {
                res.status(400).send("Missing header"); // should be allowed to supply clientid/secret in body as well

                return;
            }

            let client = db.getClient(clientId);

            if (!client && client.client_secret !== clientSecret) {
                res.status(401).send("Invalid client.");

                return;
            }

            // 2. authorization_code request =>
            if (req.body.grant_type === "authorization_code") {

                // fresh or replayed token
                if (config.verifyCode && !db.validCode(req.body.code)) {
                    res.status(400).send("Invalid code.");

                    return;
                }

                // remove code so it cannot be reused
                if (config.clearAuthorizationCode) {
                    db.deleteCode(req.body.code);
                }

                //code should contain request including clientid etc
                // 3.1 Create token
                // 3.2 Save token
                // 3.3 Create refresh token
                // 3.4 Create response
            // 3. refresh_token request =>
            } else if (req.body.grant_type === "refresh_token") {
                // 4.1 Check if token is already there (and delete ?)
                // 4.2 Create refresh token
                // 4.3 Save token
                // 4.4 Create response
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
}