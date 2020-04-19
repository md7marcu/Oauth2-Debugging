import { Request, Response } from "express";

export class AuthRoutes {
    public routes(app): void {
        app.get("/hello", async(req: Request, res: Response) => {
            res.send("World!");
        });
    }
}