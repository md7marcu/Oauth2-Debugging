import { expect, assert } from "chai";
import Db from "../lib/db/Db";
import { Guid } from "guid-typescript";

describe ("Static Db implementation", () => {
    // let db: Db;

    // beforeEach = () => {
    //     console.log("hello hello hello");
    //     this.db = new Db();
    // };

    it ("Should return undefined if the client doesn't exist", () => {
        // tslint:disable-next-line:no-unused-expression
        expect(new Db().getClient("-1")).to.be.undefined;
    });

    it ("Should return the client", () => {
        assert.equal(new Db().getClient("ukauth-client").scopes[0], "weight");
    });

    it ("Should save a request", () => {
        let guid = Guid.create();
        let db = new Db();
        db.saveRequest(guid, "test");
        let request = db.getRequest(guid);

        assert.equal(request, "test");
    });

    it ("Should save a code", () => {
        let codeId = "code123";
        let codeData = {object: "obj"};
        let db = new Db();
        db.saveCode(codeId, codeData);

        // tslint:disable-next-line:no-unused-expression
        expect(db.validCode(codeId)).to.be.true;
        assert.equal(db.getCode(codeId).object, "obj");
    });

    it ("Should return invalid code if it doesn't exist", () => {
        let db = new Db();
        let code = db.validCode("Elefant");

        // tslint:disable-next-line:no-unused-expression
        expect(code).to.be.false;
    });

    it ("Should delete a code", () => {
        let db = new Db();
        let code = "code 321";
        db.saveCode(code, {});

        let valid = db.validCode("code");

        // tslint:disable-next-line:no-unused-expression
        expect(valid).to.be.false;
    });

    it("Should delete a request", () => {
        let db = new Db();
        let guid = Guid.create();
        let stringGuid = guid.toString();

        db.saveRequest(guid, "{query: anyQuery}");
        db.deleteRequest(guid);

        let request = db.getRequest(guid);

        // tslint:disable-next-line:no-unused-expression
        expect(request).to.be.empty.string;
    });
});