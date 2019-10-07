"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dotenv_1 = require("dotenv");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const redis_1 = require("redis");
const redisOpts = {
    path: process.env.REDIS_URL,
};
const client = redis_1.createClient(redisOpts);
dotenv_1.config();
const appConfig = {
    DBX_API_DOMAIN: 'https://api.dropboxapi.com',
    DBX_OAUTH_DOMAIN: 'https://www.dropbox.com',
    DBX_OAUTH_PATH: '/oauth2/authorize',
    DBX_TOKEN_PATH: '/oauth2/token',
    DBX_LIST_FOLDER_PATH: '/2/files/list_folder',
    DBX_LIST_FOLDER_CONTINUE_PATH: '/2/files/list_folder/continue',
    DBX_GET_TEMPORARY_LINK_PATH: '/2/files/get_temporary_link',
    DBX_TOKEN_REVOKE_PATH: '/2/auth/token/revoke',
    DBX_APP_KEY: process.env.DBX_APP_KEY,
    DBX_APP_SECRET: process.env.DBX_APP_SECRET,
    OAUTH_REDIRECT_URL: process.env.OAUTH_REDIRECT_URL,
    SESSION_ID_SECRET: process.env.SESSION_ID_SECRET || 'cAt2-D0g-cAW',
};
const sess = {
    secret: appConfig.SESSION_ID_SECRET,
    cookie: {},
    resave: false,
    saveUninitialized: true,
    genid: (req) => crypto_1.default.randomBytes(16).toString('hex'),
    store: new (require('express-sessions'))({
        storage: 'redis',
        instance: client,
        collection: 'sessions',
    }),
};
exports.sess = sess;
exports.default = appConfig;
//# sourceMappingURL=config.js.map