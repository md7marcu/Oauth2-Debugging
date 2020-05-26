// lib/app.ts
import * as express from "express";
import * as bodyParser from "body-parser";
import { ResourceRoutes } from "./routes/ProtectedRoutes";
import { config } from "node-config-ts";
import * as cors from "cors";

class App {

    public app: express.Application;
    public protectedRoute: ResourceRoutes = new ResourceRoutes();

    constructor() {
        this.app = express();
        this.corsConfig();
        this.config();
        this.protectedRoute.routes(this.app);
    }

    private config(): void {
        // support application/json type post data
        this.app.use(bodyParser.json());
        // support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ extended: false }));
    }

    private corsConfig = () => {
        const whitelist = config.corsWhitelist;
        const corsOptions = {
          origin: function (origin, callback) {
            // origin is undefined server - server
            if (whitelist.indexOf(origin) !== -1 || !origin) {
              callback(undefined, true);
            } else {
              callback(new Error("Cors error."));
            }
          },
        };
        this.app.use(cors(corsOptions));
    }
}

export default new App().app;