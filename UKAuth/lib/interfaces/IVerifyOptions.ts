import { VerifyOptions } from "jsonwebtoken";
export interface IVerifyOptions extends VerifyOptions {
    iss: string;
    aud: string;
    auth_time?: string;
    nonce?: string;
    sub: string;
    exp: string;
    iat: number;
}