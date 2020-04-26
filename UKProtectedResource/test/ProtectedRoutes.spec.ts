import "mocha";
import * as Supertest from "supertest";
import app  from "../lib/app";
import { sign, VerifyOptions, verify } from "jsonwebtoken";
import { pki } from "node-forge";
import * as Fs from "fs";
import { expect } from "chai";
import { config } from "node-config-ts";

interface IVerifyOptions extends VerifyOptions {
    iss: string;
    aud: string;
}
describe("Express routes", () => {

    it("Should return 200 on alive endpoint", async () => {
        let response = await Supertest(app).get("/alive");

        expect(response.status).to.be.equal(200);
    });

    it("Should return 401 when no jwt token supplied", async () => {
        let response = await Supertest(app).get("/weight");

        expect(response.status).to.be.equal(401);
    });

    // Called with valid token and correct scope - return the protected resource
    it("Should return the weight (3) when called with a valid token", (done) => {
        let payload = {
            iss: config.issuer,
            aud: config.audience,
            scope: "weight",
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // one hour expiration
            iat: Math.floor(Date.now() / 1000) - 30, // 30 seconds ago,
        };

        Supertest(app)
        .get("/weight")
        .set("Authorization", "Bearer " + createToken(payload))
        .expect(200, { weight: "3" }, done);
    });

    // Troubleshooting key's
    it("Should verify the signature", () => {
        let serverCert = Fs.readFileSync("./config/cert.pem").toString();
        let publicKey = pki.publicKeyToPem(pki.certificateFromPem(serverCert).publicKey);
        let privateKey = Fs.readFileSync("./config/key.pem").toString();
        let token = sign({foo: "bar", aud: config.audience }, privateKey, { algorithm: "RS256"});

        try {
            let decodedToken = verify(token, publicKey,  { audience: config.audience, ignoreExpiration: true, ignoreNotBefore: true, algorithms: ["RS256"] });
        } catch (err) {
            console.log(err);
        }
        // tslint:disable-next-line:no-unused-expression
        expect(true).to.be.true;
    });

    // This will only work running locally - considering the path is outside the docker image when building
    const createToken = (options: IVerifyOptions): string => {
        return sign(options, Fs.readFileSync(config.serverKey).toString(), { algorithm: config.algorithm });
    };
});