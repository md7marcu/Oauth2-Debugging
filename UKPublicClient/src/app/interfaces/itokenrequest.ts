export default interface ITokenRequest {
    grant_type: string;
    authorization_code: string;
    client_id: string;
    redirect_uri: string;
    code_verifier: string;
}
