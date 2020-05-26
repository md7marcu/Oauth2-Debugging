/* tslint:disable */
/* eslint-disable */
declare module "node-config-ts" {
  interface IConfig {
    issuer: string
    audience: string
    verifyIssuer: boolean
    verifyAudience: boolean
    ignoreNotBefore: boolean
    ignoreExpiration: boolean
    algorithm: string
    serverCert: string
    serverKey: string
    corsWhitelist: string[]
  }
  export const config: Config
  export type Config = IConfig
}
