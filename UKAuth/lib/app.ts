// lib/app.ts
import * as express from "express";
import * as bodyParser from "body-parser";
import { AuthRoutes } from "./routes/AuthRoutes";
import Db from "./db/db";

class App {

    public app: express.Application;
    public authRoute: AuthRoutes = new AuthRoutes();

    constructor() {
        this.app = express();
        // Create the "database"
        (this.app as any).Db = new Db();
        this.config();
        this.authRoute.routes(this.app);
    }

    private config(): void {
        // support application/json type post data
        this.app.use(bodyParser.json());
        // support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ extended: false }));
        // serve static content
        this.app.use(express.static("public"));
        // views
        this.app.set("views", `${__dirname}/views`);
        // App engine - html
        this.app.set("view engine", "pug");
        // this.app.engine("html", pug));
    }
}

export default new App().app;