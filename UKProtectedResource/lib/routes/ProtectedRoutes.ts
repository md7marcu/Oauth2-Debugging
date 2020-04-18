import { Request, Response, NextFunction, Application } from "express";
import { config } from "node-config-ts";
import * as Cors from "cors";
import * as Fs from "fs";
import * as Jwt from "jsonwebtoken";
import * as Forge from "node-forge";
import * as Debug from "debug";

const debug = Debug("ProtectedRoutes");

interface IRequest extends Request {
    access_token: string;
}

export class ResourceRoutes {
    private weight = 3;
    private AUTH_HEADER = "Authorization";

    public routes(app: Application): void {
        app.get("/hello", Cors(), async(req: Request, res: Response) => {
            debug("hello world endpoint called.");
            res.send("World!");
        });

        app.get("/weight", this.retrieveAccessToken, this.requireAccessToken, Cors(), async(req: Request, res: Response, next: NextFunction) => {
            debug("weight endpoint called.");
            res.send(this.weight.toString());
            debug(`sent weight ${this.weight}`);
            next();
        });
    }

    private retrieveAccessToken = (req: IRequest, res: Response, next: NextFunction) =>{
        // get the auth servers public key
        let serverCert = Forge.pki.certificateFromPem(Fs.readFileSync("../UKAuth/config/cert.pem").toString());
        let accessToken = this.getAccessToken(req);

        debug(`Server public key: ${JSON.stringify(serverCert.publicKey)}`);

        // Verify access token
        let decodedToken;
        try {
            decodedToken = Jwt.verify(accessToken, serverCert.publicKey.toString(), this.getVerifyOptions);
        } catch (err) {
            debug(`Verifying accessToken failed ${JSON.stringify(err)}`);
            next();

            return;
        }

        if (decodedToken) {
            debug(`AccessToken signature valid. ${decodedToken}`);
            req.access_token = decodedToken.payload;
        }
        next();
    }

    // Decide what to verify in the token
    private getVerifyOptions = () => {
        let verifyOptions: Jwt.VerifyOptions;

        if (config.verifyIssuer) {
            verifyOptions.issuer = config.issuer;
        } else if (config.verifyAudience) {
            verifyOptions.audience = config.audience;
        }
        verifyOptions.ignoreNotBefore = !config.ignoreNotBefore;
        verifyOptions.ignoreExpiration = !config.ignoreExpiration;

        return verifyOptions;
    }

    private requireAccessToken = (req: IRequest, res: Response, next: NextFunction) => {

        if (req.access_token) {
            next();
        } else {
            res.status(401).end();
        }
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
}