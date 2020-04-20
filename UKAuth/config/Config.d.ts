/* tslint:disable */
/* eslint-disable */
declare module "node-config-ts" {
  interface IConfig {
    issuer: string
    audience: string
    algorithm: string
    authorizationEndpoint: string
    tokenEndpoint: string
  }
  export const config: Config
  export type Config = IConfig
}
