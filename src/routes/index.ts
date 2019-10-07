import express, {Router} from 'express';
const router = Router();
import {AppController} from '../controllers';

const controller = new AppController();

/* GET home page. */
router.get('/', controller.home);

router.get('/login', controller.login);

router.get('/logout', controller.logout);

router.get('/oauthredirect', controller.oauthredirect);

router.get('*', controller.home);

export default router;
