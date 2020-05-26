/* tslint:disable */
/* eslint-disable */
export default class Config {
  issuer: string
  audience: string
  responseType: string
  authorizationEndpoint: string
  accessTokenEndpoint: string
  protectedResource: string
  clients: Client[]
  authorizationCodeGrant: string
  refreshTokenGrant: string
  verifyState: boolean
  title: string
  verifyIss: boolean
  verifyAud: boolean
  verifyIat: boolean
  verifyExp: boolean
  verifyNonce: boolean
  usePkce: boolean
}
class Client {
  clientId: string
  clientSecret?: string
  public?: boolean
  redirectUris: string[]
  scopes: string[]
}
