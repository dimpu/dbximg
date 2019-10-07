"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = tslib_1.__importDefault(require("../../config"));
const request_promise_1 = tslib_1.__importDefault(require("request-promise"));
exports.destroySessionAsync = (req) => new Promise((resolve, reject) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        let options = {
            url: config_1.default.DBX_API_DOMAIN + config_1.default.DBX_TOKEN_REVOKE_PATH,
            headers: { Authorization: 'Bearer ' + req && req.session && req.session.token },
            method: 'POST',
        };
        let result = yield request_promise_1.default(options);
    }
    catch (error) {
        reject(new Error('error destroying token. '));
    }
    req &&
        req.session &&
        req.session.destroy(err => {
            err ? reject(err) : resolve();
        });
}));
exports.regenerateSessionAsync = (req) => new Promise((resolve, reject) => {
    req &&
        req.session &&
        req.session.regenerate(err => {
            err ? reject(err) : resolve();
        });
});
exports.getLinksAsync = (token, path = '', next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    let result = yield exports.listImagePathsAsync(token, path, next);
    let imgPaths = result.paths.filter((_path) => _path.search(/\.(gif|jpg|jpeg|tiff|png)$/i) > -1);
    let temporaryLinkResults = yield exports.getTemporaryLinksForPathsAsync(token, imgPaths);
    result.img_paths = temporaryLinkResults.map((entry) => entry.link);
    return result;
});
exports.listImagePathsAsync = (token, path, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    let options = {
        url: config_1.default.DBX_API_DOMAIN + config_1.default.DBX_LIST_FOLDER_PATH,
        headers: { Authorization: 'Bearer ' + token },
        method: 'POST',
        json: true,
        body: { path: path },
    };
    try {
        let result = yield request_promise_1.default(options);
        let paths = result.entries.map((entry) => entry.path_lower);
        let response = {};
        response.paths = paths;
        if (result.hasmore)
            response.cursor = result.cursor;
        return response;
    }
    catch (error) {
        return next(new Error('error listing folder. ' + error.message));
    }
});
exports.getTemporaryLinksForPathsAsync = (token, paths) => {
    let promises = [];
    let options = {
        url: config_1.default.DBX_API_DOMAIN + config_1.default.DBX_GET_TEMPORARY_LINK_PATH,
        headers: { Authorization: 'Bearer ' + token },
        method: 'POST',
        json: true,
    };
    paths.forEach(path_lower => {
        options.body = { path: path_lower };
        promises.push(request_promise_1.default(options));
    });
    return Promise.all(promises);
};
exports.setBreadcrumbs = (req) => {
    let menu = [
        {
            name: 'Home',
            path: '/',
        },
    ];
    let i = 0;
    let reqPaths = req.path.split('/').filter(p => p !== '');
    for (let p of reqPaths) {
        menu.push({
            name: p,
            path: '/' + reqPaths.slice(0, i + 1).join('/'),
        });
        i++;
    }
    req && req.breadcrumbs(menu);
};
exports.hasImagePath = (path) => path.match(/\.(gif|jpg|jpeg|tiff|png)$/i);
//# sourceMappingURL=index.js.map