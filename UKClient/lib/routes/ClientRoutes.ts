import { Request, Response } from "express";
import * as buildUrl from "build-url";
import { config } from "node-config-ts";
import * as Debug from "debug";
const debug = Debug("AuthClient");
import * as request from "request-promise-native";
import { find, remove } from "lodash";

export class ClientRoutes {
    private secrets = [];

    public routes(app): void {
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
            let code = req?.query?.code ?? undefined;
            let state = req?.query?.state ?? undefined;

            // TODO: Verify state
            if (config.verifyState){
                let y = true;
            }

            let headers = {"Content-Type": "application/x-www-form-urlencode"};
            let data =
                {
                    grant_type: config.authorizationCodeGrant,
                    authorization_code: code,
                    client_id: config.clients[0].clientId,
                    client_secret: config.clients[0].clientSecret,
                    redirect_uri: config.clients[0].redirectUris[0],
                };

            let options = {
                method: "POST",
                uri: config.accessTokenEndpoint,
                body: data,
                json: true,
            };

            request(options)
            .then((body) => {
                this.secrets.push({
                    accessToken: body.access_token,
                    refreshToken: body.refresh_token,
                    code: code,
                });

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
                let accessToken = req.query.accessToken;
                let secrets = find(this.secrets, (s) => s.accessToken === accessToken);

                if (!secrets) {
                    res.render("clientError", {title: config.title, error: "Invalid access token supplied."});
                } else {
                    let options = {
                        method: "GET",
                        uri: config.protectedResource,
                        json: true,
                        auth: {
                            "bearer": accessToken,
                        },
                    };
                    request.get(options)
                    .then( (response) => {
                        res.render(
                            "index", {
                                title: config.title,
                                accessToken: secrets.accessToken,
                                refreshToken: secrets.refreshToken,
                                authorizationCode: secrets.code,
                                protectedResource: response.weight,
                            });
                    })
                    .catch( (err) => {
                        res.render("clientError", { title: config.title, error: err });

                        return;
                    });
                }

            } else {
                res.render("clientError", {title: config.title, error: "No access token supplied."});
            }
        });
    }

    // TODO: Duplicated with UKAuth
    getRandomString(tokenLength: number): string {
        // tslint:disable-next-line:no-bitwise
        return [...Array(tokenLength)].map(i => (~~(Math.random() * 36)).toString(36)).join("");
    }
}