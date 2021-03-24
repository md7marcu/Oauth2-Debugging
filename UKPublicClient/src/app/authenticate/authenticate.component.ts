import { Component, OnInit } from "@angular/core";
import getRandomSha256 from "../../helpers/GetRandomSha256";
import getRandomString from "../../helpers/GetRandomString";
import * as Debug from "debug";
const debug = Debug("PublicClient:");
import Config from "../../../config/Config";
import settings from "../../../config/default.json";
import * as queryString from "query-string";
import { ActivatedRoute } from "@angular/router";
import { AuthorizationServerService } from "../services/authorization-server.service";
import ITokenRequest from "../interfaces/itokenrequest";
import { ProtectedResourceService } from "../services/protected-resource.service";
import { IVerifyOptions } from "../interfaces/iverifyoptions";
import { JwtHelperService } from "@auth0/angular-jwt";
import { HttpErrorResponse } from "@angular/common/http";
const helper = new JwtHelperService();

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
  private hasErrors: boolean;
  public error: string;
  private config: Config;

  constructor(private router: ActivatedRoute,
              private authorizationServerService: AuthorizationServerService,
              private protectedResourceSerivce: ProtectedResourceService) {
    this.hasErrors = false;
    this.config = Object.assign(new Config(), settings);
  }

  public ngOnInit(): void{

    if (this.router?.snapshot?.url[0]?.path === "callback") {
      this.authorizationCode = this.router.snapshot.queryParams.code;
      this.authenticationCallback(this.router.snapshot.queryParams);
    }
  }

  public login(): void {
    this.requestAuthentication();
  }

  public getProtectedResource(): void {
    this.protectedResourceSerivce.get(this.accessToken).subscribe(data => {
      debug(`Result from protected resource: ${JSON.stringify(data)}`);
      this.protectedResource = data.ssn;
    },
    (error: HttpErrorResponse) => {
      debug(`Got error from protected resource: ${JSON.stringify(error)}`);
      this.setError(error.message);
    });
  }

  get HasErrors() {
    this.hasErrors = this.error !== undefined;

    return this.hasErrors;
  }

  private authenticationCallback = (parameters: { [name: string]: string; }) => {
    debug("AuthenticationCallback");

    if (this.config.verifyState && !this.verifyState(parameters.state)){
      this.setError("Unknown state parameter.");

      return;
    }
    const codeVerifier = window.sessionStorage.getItem("codeVerifier");

    const body: ITokenRequest = {
      grant_type: this.config.authorizationCodeGrant,
      authorization_code: parameters?.code,
      client_id: this.config.clients[0].clientId,
      redirect_uri: this.config.clients[0].redirectUris[1],
      code_verifier: codeVerifier
    };

    this.authorizationServerService.getToken(body).subscribe(response => {
      const error = this.verifyIdToken(response.id_token, this.config.clients[0].clientId);
      this.accessToken = response.access_token;
      this.refreshToken = response.refresh_token;
      this.idToken = response.id_token;
    },
    (error: HttpErrorResponse) => {
      debug(`GetToken returned an error: ${JSON.stringify(error)}`);
      this.setError(error.message);
    });
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
        window.sessionStorage.setItem("state", state);
    }
    const codeVerifier = getRandomString(16);
    const hashedCodeVerifier = getRandomSha256(codeVerifier);

    if (this.config.usePkce) {
      (queryParams as any).code_verifier = hashedCodeVerifier;
      window.sessionStorage.setItem("codeVerifier", codeVerifier);
    }
    window.location.href = this.config.authorizationEndpoint + `?${queryString.stringify(queryParams)}`;
  }

  private verifyIdToken(idToken: string, clientId: string): boolean {
    debug("Verify Id Token");
    const decodedToken = helper.decodeToken(idToken);

    if (this.config.verifyIss && (decodedToken as IVerifyOptions).iss !== this.config.issuer) {
      this.setError("Invalid issuer (iss) in Id Token.");
      return false;
    }
    if (this.config.verifyAud && (decodedToken as IVerifyOptions).aud !== clientId) {
      this.setError("Invalid audience (aud) in Id Token.");
      return false;
    }
    if (this.config.verifyIat &&  (decodedToken as IVerifyOptions).iat > Math.floor(Date.now() / 1000)) {
      this.setError("Invalid creation time (iat) in Id Token.");
      return false;
    }
    if (this.config.verifyExp && (decodedToken as IVerifyOptions).exp < Math.floor(Date.now() / 1000)) {
      this.setError("Id Token is expired.");
      return false;
    }
    return true;
  }

  private setError(error: string): void{
    debug(`Got error: ${error}`);
    this.error = error;
  }

  private verifyState(state: string): boolean {
    return window.sessionStorage.getItem("state") === state;
  }
}
export default AuthenticateComponent;
