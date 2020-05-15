export default interface ISecret {
    accessToken: string;
    refreshToken: string;
    idToken?: string;
    code: string;
}