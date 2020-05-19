// lib/app.ts
import * as express from "express";
import * as bodyParser from "body-parser";
import { AuthRoutes } from "./routes/AuthRoutes";
import { UserRoutes } from "./routes/UserRoutes";
import Db from "./db/db";
import * as mongoose from "mongoose";
import * as Debug from "debug";
const debug = Debug("AuthServer:");
import * as MockMongoose from "mock-mongoose";

export interface IApplication extends express.Application {
    Db: Db;
}

export class App {
    public app: IApplication;
    public Db: Db;
    private authRoutes: AuthRoutes = new AuthRoutes();
    private userRoutes: UserRoutes = new UserRoutes();
    private mongoUrl: string = process.env.MONGODB_URL;
    private isDev: boolean = process.env.NODE_ENV === "test";

    constructor() {
        (this.app as any) = express();
        // Create the "database"
        this.app.Db = new Db();
        this.config();
        this.authRoutes.routes(this.app);
        this.userRoutes.routes(this.app);
        this.mongoSetup(this.mongoUrl, this.isDev);

        if (this.isDev) {
            debug("Running in development mode.");
        }
    }

    private config = (): void => {
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

    private mongoSetup = (connectionString: string, isDev: boolean): void => {

        if (isDev) {
            const mockMongoose = new MockMongoose.MockMongoose(mongoose);

            mockMongoose.prepareStorage().then( () => {
                mongoose.connect(connectionString, {
                    useNewUrlParser: true,
                    useCreateIndex: true,
                    useUnifiedTopology: true,
                }).
                catch(error =>
                    debug(`Unable to connect to mongodb @${connectionString}, error: ${error}`),
                );
            });
        } else {
            mongoose.connect(connectionString, {
                useNewUrlParser: true,
                useCreateIndex: true,
                useUnifiedTopology: true,
            }).
            catch(error =>
                debug(`Unable to connect to mongodb @${connectionString}, error: ${error}`),
            );
        }
        mongoose.connection.once("open", () => {
            debug(`Connected to MongoDB @${connectionString}`);
        });
        mongoose.connection.on("error", (error) => {
            debug(`Unable to connect to mongodb @${connectionString}, error ${error}`);
        });
    }
}

export default new App().app;