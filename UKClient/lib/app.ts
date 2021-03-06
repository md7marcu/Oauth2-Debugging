// lib/app.ts
import * as express from "express";
import * as bodyParser from "body-parser";
import { ClientRoutes } from "./routes/ClientRoutes";
import Db from "./db/db";

class App {

    public app: express.Application;
    public clientRoute: ClientRoutes = new ClientRoutes();

    constructor() {
        this.app = express();
        // Create the "database"
        (this.app as any).Db = new Db();
        this.config();

        if ("development" === this.app.get("env")) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        }
        this.clientRoute.routes(this.app);
    }

    private config(): void {
        // support static content from public folder
        this.app.use(express.static("public"));
        // support application/json type post data
        this.app.use(bodyParser.json());
        // support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ extended: false }));
        // views
        this.app.set("views", `${__dirname}/views`);
        // App engine - html
        this.app.set("view engine", "pug");
        // this.app.engine("html", pug));
    }
}

export default new App().app;