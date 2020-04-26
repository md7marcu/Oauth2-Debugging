import { find } from "lodash";
import ISecret from "interfaces/ISecret";

export default class Db {
    private secrets = [];

    // Return secret that matches an access code
    public getSecret(accessToken: string): ISecret {
        return find(this.secrets, (s) => { return s.accessToken === accessToken; });
    }

    // Stores a secret
    public saveSecret(secret: ISecret) {
        this.secrets.push(secret);
    }
}