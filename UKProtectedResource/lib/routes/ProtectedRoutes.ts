import { Request, Response, NextFunction, Application } from "express";
import { config } from "node-config-ts";
import * as Fs from "fs";
import { VerifyOptions, verify } from "jsonwebtoken";
import { pki }from "node-forge";
import * as Debug from "debug";
import { includes } from "lodash";
import * as path from "path";

const debug = Debug("ProtectedRoutes");

export interface IRequest extends Request {
    access_token: string;
}

export class ResourceRoutes {
    private ssn = "555-32-2121";
    private AUTH_HEADER = "authorization";

    public routes(app: Application): void {

        app.get("/alive", async(req: IRequest, res: Response) => {
            res.send("Success!");
        });

        app.get("/ssn", this.retrieveAccessToken, this.requireAccessToken, async(req: IRequest, res: Response, next: NextFunction) => {
            debug("ssn endpoint called.");

            // tslint:disable-next-line:whitespace
            if (includes((req?.access_token as any)?.scope, "ssn")) {
                res.send({ssn: this.ssn.toString()});
            } else {
                res.status(403).send();
                next("Forbidden");
            }
            debug(`sent ssn ${this.ssn}`);
            next();
        });
    }

    private retrieveAccessToken = (req: IRequest, res: Response, next: NextFunction) => {
        // get the auth servers public key
        let serverCert = Fs.readFileSync(path.join(process.cwd(), config.serverCert)).toString();
        let publicKey = pki.publicKeyToPem(pki.certificateFromPem(serverCert).publicKey);
        let accessToken = this.getAccessToken(req);

        debug(`Server public key: ${JSON.stringify(publicKey)}`);

        // Verify access token
        let decodedToken;
        try {
            let options = this.getVerifyOptions();
            decodedToken = verify(accessToken, publicKey, options);
        } catch (err) {
            debug(`Verifying accessToken failed: ${err.message}`);
            res.status(401).send(JSON.stringify(err));
            // tslint:disable-next-line:whitespace
            next(err?.message);
        }

        if (decodedToken) {
            debug(`AccessToken signature valid. ${decodedToken}`);
            req.access_token = decodedToken;
        }
        next();
    }

    // If access_token doesn't exist on request, we couldn't verify it => return Unauthorized
    private requireAccessToken = (req: IRequest, res: Response, next: NextFunction) => {

        if (!req.access_token) {
            res.status(401).send();
            next("Unauthorized");
        }
        next();
    }

    // Get the access token from the request
    // It should be in the header (bearer: "....")
    // It might be in the body or in the query
    // It shouldn't be, but it might
    private getAccessToken = (req: Request): string => {
        let authHeader = req.headers[this.AUTH_HEADER];
        let token: string = "";

        if (authHeader && authHeader.toString().toLowerCase().indexOf("bearer") === 0) {
            debug(`Found token in header.`);
            token = authHeader.slice("bearer ".length).toString();
        } else if (req.body && req.body.access_token) {
            debug(`Found token in body.`);
            token = req.body.access_token.toString();
        } else if (req.query && req.query.access_token) {
            debug(`Found token in header.`);
            token = req.query.access_token.toString();
        }
        debug(`Token: ${token}`);

        return token;
    }

    // Decide what to verify in the token
    private getVerifyOptions = () => {
        let verifyOptions: VerifyOptions = {};

        if (config.verifyIssuer) {
            verifyOptions.issuer = config.issuer;
        }
        if (config.verifyAudience) {
            verifyOptions.audience = config.audience;
        }
        verifyOptions.ignoreNotBefore = config.ignoreNotBefore;
        verifyOptions.ignoreExpiration = config.ignoreExpiration;
        verifyOptions.algorithms = [config.algorithm];

        return verifyOptions;
    }
}