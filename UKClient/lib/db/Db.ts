import { find, remove } from "lodash";
import ISecret from "interfaces/ISecret";

export default class Db {

    private secrets = [];
    private states = []; // should only contain the last state

    // Return secret that matches an access code
    public getSecret(accessToken: string): ISecret {
        return find(this.secrets, (s) => { return s.accessToken === accessToken; });
    }

    public getSecretWithRefresh(refreshToken: string): ISecret {
        return find(this.secrets, (s) => { return s.refreshToken === refreshToken; });
    }

    // Stores a secret
    public saveSecret(secret: ISecret) {
        this.secrets.push(secret);
    }

    public pushState(state: string) {
        this.states.push(state);
    }

    public popState(): string {
        return this.states.pop();
    }

    public removeSecret(accessToken: string) {
        remove(this.secrets, (secret) => {
            return secret.accessToken === accessToken;
        });
    }
}