import "mocha";
import * as Supertest from "supertest";
import app  from "../lib/app";
import { sign, VerifyOptions, verify } from "jsonwebtoken";
import { pki } from "node-forge";
import * as Fs from "fs";
import { expect } from "chai";
import { config } from "node-config-ts";
import * as path from "path";
import Db from "../lib/db/Db";
import { Guid } from "guid-typescript";

interface IVerifyOptions extends VerifyOptions {
    iss: string;
    aud: string;
}
describe("Express routes", () => {
    let db = (app as any).Db;

    beforeEach(() => {
        // Setup fake rendering
        app.set("views", path.join(__dirname, "../lib/views"));
        app.set("view engine", "pug");
        app.engine("pug", (viewpath, options, callback) => {
            const details = Object.assign( { viewpath }, options);
            callback(undefined, JSON.stringify(details));
        });
    });

    it("Should return 200 on alive endpoint", async () => {
        const response = await Supertest(app).get("/alive");

        expect(response.status).to.be.equal(200);
    });

    // // Troubleshooting key's
    // it("Should verify the signature", () => {
    //     let serverCert = Fs.readFileSync("./config/cert.pem").toString();
    //     let publicKey = pki.publicKeyToPem(pki.certificateFromPem(serverCert).publicKey);
    //     let privateKey = Fs.readFileSync("./config/key.pem").toString();
    //     let token = sign({foo: "bar", aud: config.audience }, privateKey, { algorithm: "RS256"});

    //     try {
    //         let decodedToken = verify(token, publicKey,  { audience: config.audience, ignoreExpiration: true, ignoreNotBefore: true, algorithms: ["RS256"] });
    //     } catch (err) {
    //         console.log(err);
    //     }
    //     // tslint:disable-next-line:no-unused-expression
    //     expect(true).to.be.true;
    // });

    it("Should render error on authorize endpoint when called without client id", async () => {
        const response = await Supertest(app).get("/authorize");

        expect(response.status).to.be.equal(200);
        expect(response.text).to.contain("Unknown Client Id.");
    });

    it("Should render error on authorize endpoint when called without redirect url", async () => {
        const response = await Supertest(app).get("/authorize").query({ clientId: config.clients[0].clientId });

        expect(response.status).to.be.equal(200);
        expect(response.text).to.contain("Invalid Redirect URL.");
    });

    it("Should redirect to callback when authorize endpoint called with invalid scope", async () => {
        const response = await Supertest(app).get("/authorize").query(
            {
                clientId: config.clients[0].clientId,
                redirectUri: config.clients[0].redirectUris[0],
                scopes: ["non existing"],
            });

        expect(response.status).to.be.equal(302);
        expect(response.text).to.contain("Invalid%20Scope.");
    });

    it("Should render allowRequest page when call is successful", async () => {
        const response = await Supertest(app).get("/authorize").query(
            {
                clientId: config.clients[0].clientId,
                redirectUri: config.clients[0].redirectUris[0],
                scopes: ["weight"],
            });

        expect(response.status).to.be.equal(200);
        expect(response.text).to.contain("allowRequest");
    });

    it("Should render error when allowRequest endpoint is called with non existing request id", async () => {
        const response = await Supertest(app).post("/allowRequest");

        expect(response.status).to.be.equal(200);
        expect(response.text).to.contain("Could not find authorization request.");
    });

    it("Should redirect to callback with error if allowed not passed in", async () => {
        let requestId = Guid.create();
        db.saveRequest(requestId, {redirectUri: "https://localhost:3002/"});

        const response = await Supertest(app)
        .post("/allowRequest")
        .type("form")
        .send({ requestId: requestId})
        .set("Accept", /application\/json/);

        expect(response.status).to.be.equal(302);
        expect(JSON.stringify(response.header)).to.contain("Access%20Denied.");
    });

    it("Should return 401 if client id is missing", async () => {
        const response = await Supertest(app)
        .post("/token")
        .type("form");

        expect(response.status).to.be.equal(401);
        expect(response.text).to.contain("Client Id and/or Client Secret.");
    });

    it("Should return 401 if client secret is invalid", async () => {
        const response = await Supertest(app)
        .post("/token")
        .type("form")
        .send(
            {
                clientId: config.clients[0].clientId,
                clientSecret: "invalid secret",
            });

        expect(response.status).to.be.equal(401);
        expect(response.text).to.contain("Invalid client secret.");
    });

    it("Should return 400 if grant type is invalid", async () => {
        const response = await Supertest(app)
        .post("/token")
        .type("form")
        .send(
            {
                clientId: config.clients[0].clientId,
                clientSecret: config.clients[0].clientSecret,
            });

        expect(response.status).to.be.equal(400);
        expect(response.text).to.contain("Invalid Grant.");
    });

    it("Should return 401 if supplied code is not valid", async () => {
        const response = await Supertest(app)
        .post("/token")
        .type("form")
        .send(
            {
                clientId: config.clients[0].clientId,
                clientSecret: config.clients[0].clientSecret,
                grantType: "authorizationCode",
                code: "invalidCode",
            });

        expect(response.status).to.be.equal(401);
        expect(response.text).to.contain("Invalid code.");
    });

    it("Should return 200 and token", async () => {
        let code = "abc123";
        let clientId = config.clients[0].clientId;
        db.saveAuthorizationCode(code, {request: {clientId: clientId, scopes: ["weight"]}});

        const response = await Supertest(app)
        .post("/token")
        .type("form")
        .send(
            {
                clientId: clientId,
                clientSecret: config.clients[0].clientSecret,
                grantType: "authorizationCode",
                code: code,
            });

        expect(response.status).to.be.equal(200);
        expect(response.text).to.contain("refreshToken");
    });
});