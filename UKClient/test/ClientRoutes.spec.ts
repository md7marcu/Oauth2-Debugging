import "mocha";
import  * as Supertest from "supertest";
import app  from "../lib/app";
import { expect } from "chai";
import * as path from "path";

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
        const response = await
        Supertest(app)
        .get("/alive");

        expect(response.status).to.be.equal(200);
        expect(response.text).to.equal("Success!");
    });
});