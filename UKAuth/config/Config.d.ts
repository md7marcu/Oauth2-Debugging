/* tslint:disable */
/* eslint-disable */
declare module "node-config-ts" {
  interface IConfig {
    settings: Settings
  }
  interface Settings {
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
    corsWhitelist: string[]
    users: User[]
    expiryTime: number
    createdTimeAgo: number
    addNonceToAccessToken: boolean
    saveAccessToken: boolean
    authorizationCodeGrant: string
    refreshTokenGrant: string
    verifyState: boolean
    useMongo: boolean
    usePkce: boolean
    overrideId: string
  }
  interface User {
    userId: string
    password: string
    email: string
    name: string
  }
  interface Client {
    clientId: string
    clientSecret?: string
    redirectUris: string[]
    scopes: string[]
    public?: boolean
  }
  export const config: Config
  export type Config = IConfig
}
