/* tslint:disable */
/* eslint-disable */
declare module "node-config-ts" {
  interface IConfig {
    responseType: string
    authorizationEndpoint: string
    accessTokenEndpoint: string
    protectedResource: string
    clients: Client[]
    authorizationCodeGrant: string
    refreshTokenGrant: string
    verifyState: boolean
    title: string
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
