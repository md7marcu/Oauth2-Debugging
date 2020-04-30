import { expect } from "chai";
import Db from "../lib/db/db";
import ISecret from "../lib/interfaces/ISecret";

describe ("Static Db implementation", () => {
    it ("Should return undefined if the secret doesn't exist.", () => {
        // tslint:disable-next-line:no-unused-expression
        expect(new Db().getSecret("xx")).to.be.undefined;
    });

    it ("Should save a secret.", () => {
        let db: Db = new Db();
        let secret: ISecret = {
            accessToken: "token",
            code: "code",
            refreshToken: "refreshToken",
        };
        db.saveSecret(secret);

        let retreivedSecret = db.getSecret("token");

        expect(secret).to.be.equal(retreivedSecret);
    });
});