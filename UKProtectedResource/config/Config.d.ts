
interface Config {
    verifyIssuer: boolean,
    issuer: string,
    verifyAudience: boolean,
    audience: string
    ignoreNotBefore: boolean,
    ignoreExpiration: boolean
  }