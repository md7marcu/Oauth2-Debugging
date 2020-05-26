import { Component, OnInit } from "@angular/core";
import getRandomSha256 from "../../helpers/GetRandomSha256";
import getRandomString from "../../helpers/GetRandomString";
import * as Debug from "debug";
const debug = Debug("PublicClient:");
import Config from "../../../config/Config";
import settings from "../../../config/default.json";
import * as queryString from "query-string";
import { ActivatedRoute } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Component({
  selector: "app-authenticate",
  templateUrl: "./authenticate.component.html",
  styleUrls: ["./authenticate.component.css"]
})
export class AuthenticateComponent implements OnInit {
  title = "UKPublicClient";
  public accessToken: string;
  public refreshToken: string;
  public authorizationCode: string;
  public idToken: string;
  public protectedResource: string;
  private config: Config;

  constructor(private router: ActivatedRoute,
              private http: HttpClient) {
    this.config = Object.assign(new Config(), settings);
  }

  public ngOnInit(): void{
    console.log(this.router.pathFromRoot);

    if (this.router?.snapshot?.url[0]?.path === "callback") {
      this.authorizationCode = this.router.snapshot.queryParams.code;
      this.authenticationCallback(this.router.snapshot.queryParams);
    }
  }

  public login(): void {
    debug("Login.");
    this.requestAuthentication();
  }

  public getProtectedResource(): void {
    debug("GetProtectedResource.");
    this.getResource();
  }

  private getResource() {

    const headers = new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: "Bearer " + this.accessToken
    });

    this.http.get<any>(this.config.protectedResource, { headers }).subscribe(data => {
      debug(`Result from protected resource: ${JSON.stringify(data)}`);
      this.protectedResource = data.ssn;
    });
  }

  private authenticationCallback = (parameters: { [name: string]: string; }) => {
    debug("AuthenticationCallback");

    // TODO MPGB 5/25/20: Render errors
    if (this.config.verifyState && !this.verifyState(parameters.state)){
      debug("Unknown state parameter.");
      console.log("Render error page: unknown state.");

      return;
    }
    const codeChallenge = window.localStorage.getItem("codeChallenge");

    const body = {
      grant_type: this.config.authorizationCodeGrant,
      authorization_code: parameters?.code,
      client_id: this.config.clients[0].clientId,
      redirect_uri: this.config.clients[0].redirectUris[1],
      code_challenge: codeChallenge
    };

    this.http.post<any>(this.config.accessTokenEndpoint, body).subscribe(data => {
      debug(`Result from token endpoint: ${JSON.stringify(data)}`);
      console.log(`Post result ${JSON.stringify(data)}`);
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.idToken = data.id_token;
    });
  }

  private verifyState(state: string): boolean {
    return window.localStorage.getItem("state") === state;
  }

  private requestAuthentication(): void {
    debug("Request Authentication");
    const scopes = this.config.clients[0].scopes;

    const queryParams = {
      response_type: this.config.responseType,
      // tslint:disable-next-line:object-literal-shorthand
      scopes: scopes,
      client_id: this.config.clients[0].clientId,
      redirect_uri: this.config.clients[0].redirectUris[0],
    };
    const state = getRandomString(16);

    if (this.config.verifyState) {
        (queryParams as any).state = state;
        window.localStorage.setItem("state", state);
    }
    const codeChallenge = getRandomString(16);
    const hasdhedCodeChallenge = getRandomSha256(codeChallenge);

    if (this.config.usePkce) {
      (queryParams as any).code_challenge = hasdhedCodeChallenge;
      window.localStorage.setItem("codeChallenge", codeChallenge);
    }
    window.location.href = this.config.authorizationEndpoint + `?${queryString.stringify(queryParams)}`;
  }
}
