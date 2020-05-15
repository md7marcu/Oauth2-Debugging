/* tslint:disable */
/* eslint-disable */
declare module "node-config-ts" {
  interface IConfig {
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
  }
  interface Client {
    clientId: string
    clientSecret: string
    redirectUris: string[]
    scopes: string[]
  }
  export const config: Config
  export type Config = IConfig
}
