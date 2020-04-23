import { find, remove } from "lodash";
import { Guid } from "guid-typescript";
import { config } from "node-config-ts";

interface IClientModel {
    clientId: string;
    clientSecret: string;
    redirectUris: [string];
    scopes: [string];
}

export default class Db {
    private clients = config.clients;
    private requests = [];
    private codes = [];
    private tokens = [];
    private refreshTokens = [];

    // Return client information for given ClientId if available, else undefined
    public getClient(clientId: string): IClientModel {
        return find(this.clients, (c) => { return c.clientId === clientId; });
    }

    public saveRequest(requestId: Guid, query: any) {
        this.requests.push({ "requestId": requestId.toString(), "query": query});
    }

    public getRequest(guid: Guid): any {
        let key = guid?.toString() ?? "";

        // tslint:disable-next-line:whitespace
        return find(this.requests, (r) => r.requestId === guid?.toString())?.query ?? "";
    }

    public deleteRequest(guid: Guid) {
        let stringGuid = guid?.toString() ?? "";

        remove(this.requests, (request) => {
            return request.requestId === stringGuid;
        });
    }

    public getCode(codeId: string) {
        return find(this.codes, (c) => c.codeId === codeId)?.object ?? {};
    }

    public saveCode(code: string, object: any) {
        this.codes.push({"codeId": code, "object": object});
    }

    public deleteCode(codeId: string) {
        remove(this.codes, (code) => {
            return code.codeId === codeId;
        });
    }

    public validCode(codeId: string): boolean {
        // tslint:disable-next-line:whitespace
        return find(this.codes, (c) => c.codeId === codeId) !== undefined;
    }

    public saveToken(token: string, clientId: string) {
        this.tokens.push({"token": token, "clientId": clientId});
    }

    public validToken(token: string): boolean {
        // tslint:disable-next-line:whitespace
        return find(this.tokens, (t) => t.token === token) !== undefined;
    }

    public getToken(token: string) {
        return find(this.tokens, (t) => t.token === token);
    }

    public saveRefreshToken(refreshToken: string, clientId: string){
        this.refreshTokens.push({"refreshToken": refreshToken, "clientId": clientId});
    }

    public validRefreshToken(refreshToken: string): boolean {
        // tslint:disable-next-line:whitespace
        return find(this.refreshTokens, (r) => r.refreshToken === refreshToken) !== undefined;
    }

    public getRefreshToken(refreshToken: string) {
        return find(this.refreshTokens, (r) => r.refreshToken === refreshToken);
    }
}