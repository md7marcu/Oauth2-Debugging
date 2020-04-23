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
    private authorizationCodes = [];
    private accessTokens = [];
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

    public getAuthorizationCode(codeId: string) {
        return find(this.authorizationCodes, (c) => c.codeId === codeId)?.object ?? {};
    }

    public saveAuthorizationCode(code: string, object: any) {
        this.authorizationCodes.push({"codeId": code, "object": object});
    }

    public deleteAuthorizationCode(codeId: string) {
        remove(this.authorizationCodes, (code) => {
            return code.codeId === codeId;
        });
    }

    public validAuthorizationCode(codeId: string): boolean {
        // tslint:disable-next-line:whitespace
        return find(this.authorizationCodes, (c) => c.codeId === codeId) !== undefined;
    }

    public saveAccessToken(accessToken: string, clientId: string) {
        this.accessTokens.push({"accessToken": accessToken, "clientId": clientId});
    }

    public validAccessToken(accessToken: string): boolean {
        // tslint:disable-next-line:whitespace
        return find(this.accessTokens, (t) => t.accessToken === accessToken) !== undefined;
    }

    public getAccessToken(accessToken: string) {
        return find(this.accessTokens, (t) => t.accessToken === accessToken);
    }

    public saveRefreshToken(refreshToken: string, clientId: string, scopes: string[]){
        this.refreshTokens.push({"refreshToken": refreshToken, "clientId": clientId, "scopes": scopes});
    }

    public validRefreshToken(refreshToken: string): boolean {
        // tslint:disable-next-line:whitespace
        return find(this.refreshTokens, (r) => r.refreshToken === refreshToken) !== undefined;
    }

    public getRefreshToken(refreshToken: string) {
        return find(this.refreshTokens, (r) => r.refreshToken === refreshToken);
    }
}