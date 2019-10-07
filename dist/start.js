"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const app_1 = tslib_1.__importDefault(require("./app"));
const port = Number(process.env.PORT || 3002);
const appServer = new app_1.default();
appServer.start(port);
//# sourceMappingURL=start.js.map