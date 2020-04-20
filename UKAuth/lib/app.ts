// lib/app.ts
import * as express from "express";
import * as bodyParser from "body-parser";
import { AuthRoutes } from "./routes/AuthRoutes";
import * as mongoose from "mongoose";

class App {

    public app: express.Application;
    public authRoute: AuthRoutes = new AuthRoutes();
    public mongoUrl = process.env.MONGODB_URL;

    constructor() {
        this.app = express();
        this.config();

        if (this.mongoUrl) {
            this.mongoSetup(this.mongoUrl);
        }
        this.authRoute.routes(this.app);
    }

    private config(): void {
        // support application/json type post data
        this.app.use(bodyParser.json());
        // support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ extended: false }));
    }

    private mongoSetup(connectionString: string): void {
        // mongoose.Promise = global.Promise;
        mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
        });
    }

}

export default new App().app;