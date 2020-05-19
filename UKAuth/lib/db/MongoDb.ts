import UserModel from "./UserModel";
import IUser from "../interfaces/IUser";
import * as Debug from "debug";
const debug = Debug("AuthServer:MongoDB");

export default class MongoDb {

    public async addUser(name: string, email: string, password: string, tokens: string[]): Promise<IUser> {
        let users = await UserModel.find({email: email});

        return await new UserModel(
            {
                name: name,
                email: email,
                password:
                password,
                tokens: tokens,
            }).save()
                .catch((error) => {
                    debug(`Failed to add user with email ${email}. err: ${JSON.stringify(error)}`);
                    return undefined;
                });
    }

    public async getUser(email: string): Promise<IUser> {
        return await UserModel.findOne({email: email});
    }
}