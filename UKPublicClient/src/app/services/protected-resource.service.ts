import { Injectable } from "@angular/core";
import Config from "../../../config/Config";
import settings from "../../../config/default.json";
import * as Debug from "debug";
import { Observable } from "rxjs/internal/Observable";
import { HttpClient, HttpHeaders } from "@angular/common/http";
const debug = Debug("AuthorizationServerService:");

@Injectable({
  providedIn: "root"
})
export class ProtectedResourceService {
  private config: Config;

  constructor(private http: HttpClient) {
    this.config = Object.assign(new Config(), settings);
  }

  public get(token: string): Observable<any> {
    const headers = new HttpHeaders({
      "Content-TYpe": "application/json",
      Authorization: "Bearer " + token
    });

    return this.http.get<string>(this.config.protectedResource, { headers });
  }
}
