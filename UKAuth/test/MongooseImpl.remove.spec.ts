import "mocha";
import { expect } from "chai";
import { UserModel } from "../lib/db/UserModel";
import IUser from "../lib/interfaces/IUser";

describe("Test Mongoose impl.", () => {
    let user: IUser = {
        name: "Test",
        password: "secret",
        email: "test@test.nu",
    };

    after( () => {
        UserModel.collection.remove({email: user.email});
    });

    it("Should save a user", async () => {
        let originalCount: number;
        await UserModel.countDocuments({}, (error, count) => {
            originalCount = count;
        }).exec();

        let userModel = await new UserModel(user).save();

        let newCount: number;
        await UserModel.countDocuments({}, (error, count) => {
            newCount = count;
        }).exec();

        expect(originalCount + 1).to.be.equal(newCount);
    });
});