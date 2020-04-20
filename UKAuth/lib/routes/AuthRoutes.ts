import { Request, Response } from "express";

export class AuthRoutes {

    // Refactor extract to db
    // Mock db
    private  refreshTokens = {};
    private accessTokens = [];
    private codes = {};
    private requests = {};

    public routes(app): void {
        app.get("/hello", async(req: Request, res: Response) => {
            res.send("World!");
        });

        app.get("/authorize", async(req: Request, res: Response) => {
            // 1. Verify ClientId

            // 2. Verify Redirect URL
            //    and set it on reply
            // 3. Verify Scope

            // 4. Create RequestId and store

            res.status(200).send();
        });

        app.get("/approve", async(req: Request, res: Response) => {
            // 1. Get request id
            // 2. Get saved query
            // 3. Delete request id [We don't want anyone to replay the req id]
            // 4. Validate that there is in fact a matching authorization request (#2)

            // 5. If "code" query [if not redirect error]
            // 6. Verify scopes - should be the same as the clients scope
            // 7. create code
              // 7.1 Create request id
              // 7.2 Store request query with key request id
              // 7.3 Redirect to approve

            // Unclear
            res.status(200).send();
        });

        app.get("/token", async(req: Request, res: Response) => {
            // 1. if authorization header grab client id and secrets
            // 2. if not authorization header grab from body [skip this]
            // 3. authorization_code =>
                // 3.1 Create token
                // 3.2 Save token
                // 3.3 Create refresh token
                // 3.4 Create response
            // 4. refresh_token =>
                // 4.1 Check if token is already there (and delete ?)
                // 4.2 Create refresh token
                // 4.3 Save token
                // 4.4 Create response
                res.status(200).send();
        });
    }
}