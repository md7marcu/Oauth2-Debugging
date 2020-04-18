// lib/server.ts
import app from "./app";
import * as https from "https";
import * as fs from "fs";
import * as Debug from "debug";
const debug = Debug("ProtectedRoutes");

const PORT = process.env.port;

const httpsOptions = {
    key: fs.readFileSync("./config/key.pem"),
    cert: fs.readFileSync("./config/cert.pem"),
};

https.createServer(httpsOptions, app).listen(PORT, () => {
    debug("Express server listening on port " + PORT);
});