import { find, remove } from "lodash";
import { Guid } from "guid-typescript";
import { config } from "node-config-ts";

interface IClientModel {
    client_id: string;
    client_secret: string;
    redirect_uris: [string];
    scopes: [string];
}

export default class Db {
    private clients = config.clients;
    private requests = [];
    private codes = [];

    // Return client information for given ClientId if available, else undefined
    public getClient(clientId: string): IClientModel {
        return find(this.clients, (c) => { return c.client_id === clientId; });
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
}