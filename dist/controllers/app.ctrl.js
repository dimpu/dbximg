"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const config_1 = tslib_1.__importDefault(require("../config"));
const node_cache_1 = tslib_1.__importDefault(require("node-cache"));
const functions_1 = require("../shared/functions");
const request_promise_1 = tslib_1.__importDefault(require("request-promise"));
const nodeCache = new node_cache_1.default();
class AppController {
    constructor() {
        this.home = (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let token = req && req.session && req.session.token;
            if (!token)
                res.redirect('/login');
            try {
                let path = req.path === '/' ? '' : req.path;
                let isNotImgPath = true;
                if (functions_1.hasImagePath(path)) {
                    path = '/' ? '' : '';
                    isNotImgPath = false;
                }
                let { paths, img_paths } = yield functions_1.getLinksAsync(token, path, next);
                functions_1.setBreadcrumbs(req);
                if (paths.length > 0 && isNotImgPath) {
                    let folders = paths.filter((_path) => !_path.match(/\.(gif|jpg|jpeg|tiff|png)$/i));
                    let img_folders_path = paths.filter((_path) => _path.match(/\.(gif|jpg|jpeg|tiff|png)$/i));
                    let imgs = [];
                    for (let i = 0; i < img_paths.length; i++) {
                        let img_folders = {};
                        img_folders.path = img_folders_path[i];
                        img_folders.img_path = img_paths[i];
                        imgs.push(img_folders);
                    }
                    res.render('folders', {
                        breadcrumbs: req.breadcrumbs(),
                        folders,
                        imgs,
                        layout: false,
                    });
                }
                else if (img_paths.length > 0) {
                    res.render('gallery', { imgs: img_paths, layout: false });
                }
                else {
                    res.render('empty', { layout: false });
                }
            }
            catch (error) {
                return next(new Error('Error getting images from Dropbox'));
            }
        });
        this.login = (req, res) => {
            let state = crypto_1.default.randomBytes(16).toString('hex');
            nodeCache.set(state, req.sessionID, 600);
            let dbxRedirect = config_1.default.DBX_OAUTH_DOMAIN +
                config_1.default.DBX_OAUTH_PATH +
                '?response_type=code&client_id=' +
                config_1.default.DBX_APP_KEY +
                '&redirect_uri=' +
                config_1.default.OAUTH_REDIRECT_URL +
                '&state=' +
                state;
            res.redirect(dbxRedirect);
        };
        this.oauthredirect = (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (req && req.query && req.query.error_description) {
                return next(new Error(req.query.error_description));
            }
            let state = req.query.state;
            if (nodeCache.get(state) != req.sessionID) {
                return next(new Error('session expired or invalid state'));
            }
            if (req.query.code) {
                let options = {
                    url: config_1.default.DBX_API_DOMAIN + config_1.default.DBX_TOKEN_PATH,
                    qs: {
                        code: req.query.code,
                        grant_type: 'authorization_code',
                        client_id: config_1.default.DBX_APP_KEY,
                        client_secret: config_1.default.DBX_APP_SECRET,
                        redirect_uri: config_1.default.OAUTH_REDIRECT_URL,
                    },
                    method: 'POST',
                    json: true,
                };
                try {
                    let response = yield request_promise_1.default(options);
                    yield functions_1.regenerateSessionAsync(req);
                    if (req && req.session) {
                        req.session.token = response.access_token;
                    }
                    res.redirect('/');
                }
                catch (error) {
                    return next(new Error('error getting token. ' + error.message));
                }
            }
        });
        this.logout = (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield functions_1.destroySessionAsync(req);
                res.redirect('/login');
            }
            catch (error) {
                return next(new Error('error logging out. ' + error.message));
            }
        });
    }
}
exports.AppController = AppController;
//# sourceMappingURL=app.ctrl.js.map