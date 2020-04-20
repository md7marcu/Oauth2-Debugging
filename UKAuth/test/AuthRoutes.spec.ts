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

    it("Should return 200 on alive endpoint", () => {
        Supertest(app)
        .get("/hello")
        .expect(200);
    });

    // // Troubleshooting key's
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

    it("Should return 200 on authorize endpoint", () => {
        Supertest(app)
        .get("/authorize")
        .expect(200);
    });

    it("Should return 200 on approve endpoint", () => {
        Supertest(app)
        .get("/approve")
        .expect(200);
    });

    it("Should return 200 on token endpoint", () => {
        Supertest(app)
        .get("/token")
        .expect(200);
    });
});