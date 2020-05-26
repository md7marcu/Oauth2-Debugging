export interface IVerifyOptions {
    iss: string;
    aud: string;
    auth_time?: string;
    nonce?: string;
    sub: string;
    exp: number;
    iat: number;
}
