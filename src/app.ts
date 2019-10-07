import express, { Application, Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import favicon from 'serve-favicon';
import logger from 'morgan';
import NodeDebug from 'debug';
import crypto from 'crypto';
import session from 'express-session';
import helmet from 'helmet';
const breadcrumbs = require('express-breadcrumbs');
import { sess } from './config';
import router from './routes/index';

const debug = NodeDebug('dbximgs:server');

class AppServer {
  app: Application = express();

  constructor() {
    this.app.use(session(sess));
    this.app.use(helmet());
    // view engine setup
    this.app.set('views', path.join(__dirname, 'views'));
    this.app.set('view engine', 'hbs');
    this.app.use(breadcrumbs.init());

    // uncomment after placing your favicon in /public
    // this.app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    this.app.use(logger('dev'));
    this.app.use(bodyParser.json());
    this.app.use(
      bodyParser.urlencoded({
        extended: false,
      })
    );
    if (this.app.get('env') === 'production') {
      this.app.set('trust proxy', 1); // trust first proxy
      //sess.cookie.secure = true; // serve secure cookies
    }
    this.app.use(cookieParser());
    this.app.use(express.static(path.join(__dirname, 'public')));
    this.app.use('/', router);
    this.app.use(this.errorHandler);
    this.app.use(this.onError);
  }

  onError = (req: Request, res: Response, next: NextFunction) => {
    let err: any = new Error('Not Found');
    err.status = 404;
    next(err);
  };

  errorHandler = (err: any, req: Request, res: Response) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  };

  start = (port: number) => {
    this.app.listen(port, () => {
      debug('Listening on ' + port);
    });
  };
}
export default AppServer;
