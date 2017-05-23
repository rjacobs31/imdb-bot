const imdb = require('imdb-api');
const config = require('../data/config');

if (!config.imdbApiKey) throw new Error('OMDb API key not set.');
const imdbOpts = {apiKey: config.imdbApiKey};

module.exports = {
  get: function get(name, cb) {
    return imdb.get(name, imdbOpts, cb);
  },
  getById: function getById(imdbid, cb) {
    return imdb.getById(imdbid, imdbOpts, cb);
  },
  getReq: function getReq(req, cb) {
    req.apiKey = imdbOpts.apiKey;
    return imdb.getReq(req, cb);
  }
};
