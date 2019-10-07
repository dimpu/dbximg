import {Request, NextFunction} from 'express';
import config from '../../config';
import rp from 'request-promise';

export const destroySessionAsync = (req: Request) =>
  new Promise(async (resolve, reject) => {
    try {
      //First ensure token gets revoked in Dropbox.com
      let options = {
        url: config.DBX_API_DOMAIN + config.DBX_TOKEN_REVOKE_PATH,
        headers: {Authorization: 'Bearer ' + req && req.session && req.session.token},
        method: 'POST',
      };
      let result = await rp(options);
    } catch (error) {
      reject(new Error('error destroying token. '));
    }

    //then destroy the session
    req &&
      req.session &&
      req.session.destroy(err => {
        err ? reject(err) : resolve();
      });
  });

export const regenerateSessionAsync = (req: Request) =>
  new Promise((resolve, reject) => {
    req &&
      req.session &&
      req.session.regenerate(err => {
        err ? reject(err) : resolve();
      });
  });

/*Gets temporary links for a set of files in the root folder of the app
It is a two step process:
1.  Get a list of all the paths of files in the folder
2.  Fetch a temporary link for each file in the folder */
export const getLinksAsync = async (token: string, path = '', next: NextFunction) => {
  //List images from the root of the app folder
  let result: any = await listImagePathsAsync(token, path, next);
  //Get a temporary link for each of those paths returned
  let imgPaths = result.paths.filter(
    (_path: string) => _path.search(/\.(gif|jpg|jpeg|tiff|png)$/i) > -1
  );

  let temporaryLinkResults = await getTemporaryLinksForPathsAsync(token, imgPaths);

  //Construct a new array only with the link field
  result.img_paths = temporaryLinkResults.map((entry: any) => entry.link);

  return result;
};

/*
Returns an object containing an array with the path_lower of each
image file and if more files a cursor to continue */
export const listImagePathsAsync = async (token: string, path: string, next: NextFunction) => {
  let options = {
    url: config.DBX_API_DOMAIN + config.DBX_LIST_FOLDER_PATH,
    headers: {Authorization: 'Bearer ' + token},
    method: 'POST',
    json: true,
    body: {path: path},
  };

  try {
    //Make request to Dropbox to get list of files
    let result = await rp(options);
    //Get an array from the entries with only the path_lower fields
    let paths = result.entries.map((entry: any) => entry.path_lower);

    //return a cursor only if there are more files in the current folder
    let response: any = {};
    response.paths = paths;
    if (result.hasmore) response.cursor = result.cursor;
    return response;
  } catch (error) {
    return next(new Error('error listing folder. ' + error.message));
  }
};

//Returns an array with temporary links from an array with file paths
export const getTemporaryLinksForPathsAsync = (token: string, paths: string[]) => {
  let promises: any = [];
  let options: any = {
    url: config.DBX_API_DOMAIN + config.DBX_GET_TEMPORARY_LINK_PATH,
    headers: {Authorization: 'Bearer ' + token},
    method: 'POST',
    json: true,
  };

  //Create a promise for each path and push it to an array of promises
  paths.forEach(path_lower => {
    options.body = {path: path_lower};
    promises.push(rp(options));
  });

  //returns a promise that fullfills once all
  //the promises in the array complete or one fails
  return Promise.all(promises);
};

export const setBreadcrumbs = (req: Request) => {
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
  req && (<any>req).breadcrumbs(menu);
};

export const hasImagePath = (path: string) => path.match(/\.(gif|jpg|jpeg|tiff|png)$/i);
