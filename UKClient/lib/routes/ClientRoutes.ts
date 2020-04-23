import { Request, Response } from "express";

export class ClientRoutes {
    public routes(app): void {
        app.get("/alive", async(req: Request, res: Response) => {
            res.send("Success!");
        });
    }
}