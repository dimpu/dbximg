import {Request, Response, NextFunction} from 'express';
import crypto from 'crypto';
import appConfig from '../config';
import NodeCache from 'node-cache';
import {
  destroySessionAsync,
  regenerateSessionAsync,
  getLinksAsync,
  setBreadcrumbs,
  hasImagePath,
} from '../shared/functions';
import rp from 'request-promise';

const nodeCache = new NodeCache();

class AppController {
  home = async (req: Request, res: Response, next: NextFunction) => {
    let token = req && req.session && req.session.token;
    if (!token) res.redirect('/login');
    try {
      let path = req.path === '/' ? '' : req.path;
      let isNotImgPath = true;
      if (hasImagePath(path))  {
              path = '/' ? '' : '';
        isNotImgPath = false;
      }
      let {paths, img_paths} = await getLinksAsync(token, path, next);

      setBreadcrumbs(req);

      if (paths.length > 0 && isNotImgPath) {
        let folders = paths.filter((_path: string) => !_path.match(/\.(gif|jpg|jpeg|tiff|png)$/i));
        let img_folders_path = paths.filter((_path: string) =>
          _path.match(/\.(gif|jpg|jpeg|tiff|png)$/i)
        );
        let imgs = [];
        for (let i = 0; i < img_paths.length; i++) {
          let img_folders: any = {};
          img_folders.path = img_folders_path[i];
          img_folders.img_path = img_paths[i];
          imgs.push(img_folders);
        }

        res.render('folders', {
          breadcrumbs: (<any>req).breadcrumbs(),
          folders,
          imgs,
          layout: false,
        });
      } else if (img_paths.length > 0) {
        res.render('gallery', {imgs: img_paths, layout: false});
      } else {
        //if no images, ask user to upload some
        res.render('empty', {layout: false});
      }
    } catch (error) {
      return next(new Error('Error getting images from Dropbox'));
    }
  };

  login = (req: Request, res: Response) => {
    let state = crypto.randomBytes(16).toString('hex');

    nodeCache.set(state, req.sessionID, 600);

    let dbxRedirect =
      appConfig.DBX_OAUTH_DOMAIN +
      appConfig.DBX_OAUTH_PATH +
      '?response_type=code&client_id=' +
      appConfig.DBX_APP_KEY +
      '&redirect_uri=' +
      appConfig.OAUTH_REDIRECT_URL +
      '&state=' +
      state;

    res.redirect(dbxRedirect);
  };

  // on outh success
  oauthredirect = async (req: Request, res: Response, next: NextFunction) => {
    if (req && req.query && req.query.error_description) {
      return next(new Error(req.query.error_description));
    }

    let state = req.query.state;

    //if(!nodeCache.get(state)){
    if (nodeCache.get(state) != req.sessionID) {
      return next(new Error('session expired or invalid state'));
    }

    //Exchange code for token
    if (req.query.code) {
      let options = {
        url: appConfig.DBX_API_DOMAIN + appConfig.DBX_TOKEN_PATH,
        //build query string
        qs: {
          code: req.query.code,
          grant_type: 'authorization_code',
          client_id: appConfig.DBX_APP_KEY,
          client_secret: appConfig.DBX_APP_SECRET,
          redirect_uri: appConfig.OAUTH_REDIRECT_URL,
        },
        method: 'POST',
        json: true,
      };

      try {
        let response = await rp(options);

        //we will replace later cache with a proper storage
        //nodeCache.set("aTempTokenKey", response.access_token, 3600);
        await regenerateSessionAsync(req);
        if (req && req.session) {
          req.session.token = response.access_token;
        }

        res.redirect('/');
      } catch (error) {
        return next(new Error('error getting token. ' + error.message));
      }
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await destroySessionAsync(req);
      res.redirect('/login');
    } catch (error) {
      return next(new Error('error logging out. ' + error.message));
    }
  };
}

export {AppController};
