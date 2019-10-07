import AppServer from './app';
const port = Number(process.env.PORT || 3002);
const appServer = new AppServer();

appServer.start(port);
