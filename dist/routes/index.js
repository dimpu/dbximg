"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = express_1.Router();
const controllers_1 = require("../controllers");
const controller = new controllers_1.AppController();
router.get('/', controller.home);
router.get('/login', controller.login);
router.get('/logout', controller.logout);
router.get('/oauthredirect', controller.oauthredirect);
router.get('*', controller.home);
exports.default = router;
//# sourceMappingURL=index.js.map