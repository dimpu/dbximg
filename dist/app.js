"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const path = tslib_1.__importStar(require("path"));
const bodyParser = tslib_1.__importStar(require("body-parser"));
const cookie_parser_1 = tslib_1.__importDefault(require("cookie-parser"));
const morgan_1 = tslib_1.__importDefault(require("morgan"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const express_session_1 = tslib_1.__importDefault(require("express-session"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const breadcrumbs = require('express-breadcrumbs');
const config_1 = require("./config");
const index_1 = tslib_1.__importDefault(require("./routes/index"));
const debug = debug_1.default('dbximgs:server');
class AppServer {
    constructor() {
        this.app = express_1.default();
        this.onError = (req, res, next) => {
            let err = new Error('Not Found');
            err.status = 404;
            next(err);
        };
        this.errorHandler = (err, req, res) => {
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};
            res.status(err.status || 500);
            res.render('error');
        };
        this.start = (port) => {
            this.app.listen(port, () => {
                debug('Listening on ' + port);
            });
        };
        this.app.use(express_session_1.default(config_1.sess));
        this.app.use(helmet_1.default());
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.set('view engine', 'hbs');
        this.app.use(breadcrumbs.init());
        this.app.use(morgan_1.default('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({
            extended: false,
        }));
        if (this.app.get('env') === 'production') {
            this.app.set('trust proxy', 1);
        }
        this.app.use(cookie_parser_1.default());
        this.app.use(express_1.default.static(path.join(__dirname, 'public')));
        this.app.use('/', index_1.default);
        this.app.use(this.errorHandler);
        this.app.use(this.onError);
    }
}
exports.default = AppServer;
//# sourceMappingURL=app.js.map