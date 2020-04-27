import { Request, Response } from "express";
import * as buildUrl from "build-url";
import { config, Config } from "node-config-ts";
import * as Debug from "debug";
const debug = Debug("AuthClient");
import * as request from "request-promise-native";
import Db from "../db/db";
import ISecret from "interfaces/ISecret";

interface IServiceDto {
    statusCode: number;
    hasError: boolean;
    payload: any;
}
export class ClientRoutes {
    public routes(app): void {
        let db: Db = app.Db;

        app.get("/alive", async(req: Request, res: Response) => {
            debug("Alive endpoint called.");

            res.send("Success!");
        });

        app.get("/", async(req: Request, res: Response) => {
            debug("Index called");

            res.render("index", {
                title: config.title,
            });
        });

        app.get("/authorize", async(req: Request, res: Response) => {
            debug("Authorize endpoint called.");
            let queryParams = {
                    response_type: config.responseType,
                    scopes: config.clients[0].scopes,
                    client_id: config.clients[0].clientId,
                    redirect_uri: config.clients[0].redirectUris[0],
            };

            if (config.verifyState) {
                (queryParams as any).state = this.getRandomString(16);
                db.pushState((queryParams as any).state);
            }

            let authorize = buildUrl(config.authorizationEndpoint, { queryParams: queryParams });
            debug(`Redirecting to ${authorize}`);
            res.redirect(authorize);
        });

        app.get("/authorizeCallback", async(req: Request, res: Response) => {
            debug(`authorizeCallback endpoint called.`);

            if (req?.query?.error) {
                res.render("clientError", { title: config.title, error: req.query.error });

                return;
            }
            let code: string = (req?.query?.code ?? undefined) as string;
            let state: string = (req?.query?.state ?? undefined) as string;

            if (config.verifyState){
                let savedState: string = db.popState();

                if (state !== savedState) {
                    // Someone is trying to replay a token or created their own
                    res.render("clientError", { title: config.title, error: "Invalid state received."});

                    return;
                }
            }

            let data = {
                    grant_type: config.authorizationCodeGrant,
                    authorization_code: code,
                    client_id: config.clients[0].clientId,
                    client_secret: config.clients[0].clientSecret,
                    redirect_uri: config.clients[0].redirectUris[0],
                };

            let accessTokenEndpoint = this.getAccessTokenEndpoint();
            let options = {
                method: "POST",
                uri: accessTokenEndpoint,
                body: data,
                json: true,
            };

            request(options)
            .then((body) => {
                db.saveSecret({accessToken: body.access_token, refreshToken: body.refresh_token, code: code});
                res.render("index", {
                    title: config.title,
                    accessToken: body.access_token,
                    refreshToken: body.refresh_token,
                    authorizationCode: code,
                });
            })
            .catch((err) => {
                res.render("clientError", { title: config.title, error: err });

                return;
            });
        });
        // TODO: Thou shalt not pass tokens/codes/secrets as a query parameters
        // https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url
        app.get("/getResource", async(req: Request, res: Response) => {
            debug(`getResource endpoint called.`);

            if (req.query) {
                let accessToken: string = req.query.accessToken as string;
                let secret: ISecret = db.getSecret(accessToken);

                if (!secret) {
                    res.render("clientError", {title: config.title, error: "Invalid access token supplied."});

                    return;
                }
                let protectedResourceResult: IServiceDto;

                try {
                    protectedResourceResult = await this.getProtectedResouce(db, accessToken);
                } catch (err) {
                    res.render("clientError", {title: config.title, error: "Unknown error."});

                    return;
                }

                // If we're getting an (assumed) 401 from an expired token, we get a new one and retry the operation
                if (protectedResourceResult.hasError && protectedResourceResult.statusCode === 401) {
                    let result: IServiceDto;

                    try {
                        result = await this.getRefreshToken(db, secret.refreshToken);
                    } catch (err) {
                        res.render("clientError", {title: config.title, error: "Unknown error."});
                        return;
                    }

                    if (result.hasError){
                        res.render("clientError", result.payload);
                        return;
                    }
                    // Get the new access token
                    secret = db.getSecretWithRefresh(secret.refreshToken);

                    try{
                        protectedResourceResult = await this.getProtectedResouce(db, secret.accessToken);
                    } catch (err) {
                        res.render("clientError", {title: config.title, error: "Unknown Error."});
                    }

                    // unrecoverable error (unknown...)
                    if (protectedResourceResult.hasError) {
                        res.render("clientError", protectedResourceResult.payload);
                        return;
                    }
                }
                let payload = protectedResourceResult.payload;

                if (!protectedResourceResult.hasError && payload) {
                    payload.accessToken = secret.accessToken;
                    payload.refreshToken = secret.refreshToken;
                    payload.authorizationCode = secret.code;
                    res.render("index", payload);

                    return;
                }
            } else {
                res.render("clientError", {title: config.title, error: "No access token supplied."});

                return;
            }
            res.render("clientError", {title: config.title, error: "Unknown error."});
        });
    }

    async getProtectedResouce(db: Db, accessToken: string): Promise<IServiceDto> {
        let options = {
            method: "GET",
            uri: this.getProtectedResourceEndpoint(),
            json: true,
            auth: {
                "bearer": accessToken,
            },
        };

        try {
            return await request.get(options)
                .then( (response) => {
                    return {
                        hasError: false,
                        payload: {
                            title: config.title,
                            protectedResource: response.ssn,
                        },
                    };
                })
                .catch((err) => {
                    // If 401 - delete the token from db
                    if (err?.statusCode === 401) {
                        db.removeSecret(accessToken);
                    }
                    return {
                        hasError: true,
                        statusCode: err?.statusCode,
                        payload: {
                            title: config.title,
                            error: err?.message,
                        }};
                });
            } catch (err) {
                return {
                    hasError: true,
                    statusCode: 500,
                    payload: {
                        title: config.title,
                        error: JSON.stringify(err),
                    },
                };
            }
    }

    async getRefreshToken(db: Db, refreshToken: string): Promise<IServiceDto> {
        let data = {
            grant_type: config.refreshTokenGrant,
            client_id: config.clients[0].clientId,
            client_secret: config.clients[0].clientSecret,
            refresh_token: refreshToken,
        };

        let accessTokenEndpoint = this.getAccessTokenEndpoint();
        let options = {
            method: "POST",
            uri: accessTokenEndpoint,
            body: data,
            json: true,
        };

        try {
            return await request(options)
                .then((body) => {
                    db.saveSecret({accessToken: body.access_token, refreshToken: refreshToken, code: undefined});
                    return {hasError: false, statusCode: 200, payload: { accessToken: body.access_token, refreshToken: refreshToken}};
                })
                .catch((err) => {
                    return {hasError: true, statusCode: 500, payload: { title: config.title, error: err }};
                });
        } catch (err) {
            return {
                hasError: true,
                statusCode: 500,
                payload: {
                    title: config.title,
                    error: JSON.stringify(err),
                },
            };
        }
    }
    // If we're running from the parent docker compose we need to get the host name of the protected resource
    getProtectedResourceEndpoint() {
        return process.env.protectedResource ? process.env.protectedResource : config.protectedResource;
    }
    // If we're running from the parent docker compose we need to get the host name of the protected resource
    getAccessTokenEndpoint() {
        return process.env.accessTokenEndpoint ? process.env.accessTokenEndpoint : config.accessTokenEndpoint;
    }

    // TODO: Duplicated with UKAuth
    getRandomString(tokenLength: number): string {
        // tslint:disable-next-line:no-bitwise
        return [...Array(tokenLength)].map(i => (~~(Math.random() * 36)).toString(36)).join("");
    }
}