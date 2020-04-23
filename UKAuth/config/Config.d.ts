/* tslint:disable */
/* eslint-disable */
declare module "node-config-ts" {
  interface IConfig {
    issuer: string
    audience: string
    subject: string
    algorithm: string
    authorizationEndpoint: string
    tokenEndpoint: string
    aliveEndpoint: string
    scopes: string
    verifyRedirectUrl: boolean
    verifyClientId: boolean
    verifyScope: boolean
    verifyCode: boolean
    validateScope: boolean
    clearAuthorizationCode: boolean
    clearRequestId: boolean
    accessCodeLength: number
    tokenLength: number
    refreshTokenLength: number
    clients: Client[]
    expiryTime: number
    createdTimeAgo: number
    addNonceToToken: boolean
    saveToken: boolean
  }
  interface Client {
    client_id: string
    client_secret: string
    redirect_uris: string[]
    scopes: string[]
  }
  export const config: Config
  export type Config = IConfig
}
