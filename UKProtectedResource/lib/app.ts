// lib/app.ts
import * as express from "express";
import * as bodyParser from "body-parser";
import { ResourceRoutes } from "./routes/ProtectedRoutes";

class App {

    public app: express.Application;
    public protectedRoute: ResourceRoutes = new ResourceRoutes();

    constructor() {
        this.app = express();
        this.config();
        this.protectedRoute.routes(this.app);
    }

    private config(): void {
        // support application/json type post data
        this.app.use(bodyParser.json());
        // support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ extended: false }));
    }
}

export default new App().app;