/* tslint:disable */
/* eslint-disable */
declare module "node-config-ts" {
  interface IConfig {
    issuer: string
    audience: string
    subject: string
    algorithm: string
    authorizationEndpoint: string
    accessTokenEndpoint: string
    aliveEndpoint: string
    scopes: string
    verifyRedirectUrl: boolean
    verifyClientId: boolean
    verifyScope: boolean
    verifyCode: boolean
    validateScope: boolean
    clearAuthorizationCode: boolean
    clearRequestId: boolean
    authorizationCodeLength: number
    accessTokenLength: number
    refreshTokenLength: number
    clients: Client[]
    expiryTime: number
    createdTimeAgo: number
    addNonceToAccessToken: boolean
    saveAccessToken: boolean
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