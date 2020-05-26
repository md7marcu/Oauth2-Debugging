import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import ITokenRequest from "../interfaces/itokenrequest";
import ITokenResponse from "../interfaces/itokenresponse";
import Config from "../../../config/Config";
import settings from "../../../config/default.json";
import * as Debug from "debug";
import { Observable } from "rxjs/internal/Observable";
const debug = Debug("AuthorizationServerService:");

@Injectable({
  providedIn: "root"
})

export class AuthorizationServerService {
  private config: Config;

  constructor(private http: HttpClient) {
      this.config = Object.assign(new Config(), settings);
  }

  public getToken(body: ITokenRequest): Observable<ITokenResponse> {
    return this.http.post<ITokenResponse>(this.config.accessTokenEndpoint, body);
  }
}
