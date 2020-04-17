import { Request, Response } from "express";

export class UserRoutes {
    public routes(app): void {
        app.get("/", async(req: Request, res: Response) => {
            res.send("Hello World!");
        });
    }
}