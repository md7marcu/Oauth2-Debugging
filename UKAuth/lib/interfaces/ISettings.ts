export default interface ISettings {
    overrideId: String;
    issuer: String;
    audience: String;
    subject: String;
    algorithm: String;
    authorizationEndpoint: String;
    accessTokenEndpoint: String;
    aliveEndpoint: String;
    scopes: String;
    verifyRedirectUrl: Boolean;
    verifyClientId: Boolean;
    verifyScope: Boolean;
    verifyCode: Boolean;
    validateScope: Boolean;
    clearAuthorizationCode: Boolean;
    clearRequestId: Boolean;
    authorizationCodeLength: Number;
    accessTokenLength: Number;
    refreshTokenLength: Number;
    clients: [
        {
            clientId: String;
            clientSecret: String;
            redirectUris: [String];
            scopes: [String];
        }
    ];
    users: [
        {
            userId: String;
            password: String;
            email: String;
            name: String;
        }
    ];
    expiryTime: Number;
    createdTimeAgo: Number;
    addNonceToAccessToken: Boolean;
    saveAccessToken: Boolean;
    authorizationCodeGrant: String;
    refreshTokenGrant: String;
    verifyState: Boolean;
    useMongo: Boolean;
}