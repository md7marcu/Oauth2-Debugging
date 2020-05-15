import { find, remove } from "lodash";
import ISecret from "interfaces/ISecret";
import IClientState from "interfaces/IClientState";

export default class Db {

    private secrets = [];
    private states = []; // should only contain the last state
    private clientState: IClientState [] = []; // This is something specific for this test case, we have two clients in the same client

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

    public saveClientState(client: string, state: string) {
        let clientState: IClientState = {clientId: client, state: state };
        this.clientState.push(clientState);
    }

    public getClientFromState(state: string): string {
        return find(this.clientState, ["state", state]).clientId;
    }
}
