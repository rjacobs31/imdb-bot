let _ = require('lodash');
let cheerio = require('cheerio');
let rp = require('request-promise');
let Promise = require('bluebird');

const urlPrefix = 'https://www.imdb.com/title/';
const imdbIdRe = /^tt[0-9]+$/;

module.exports = function(bp) {
  let cachedMovie = require('./cached_movie')(bp);


  function getSimilar(id, count) {
    let url = id;
    if (!id) return Promise.reject(new Error('ID not set'));
    if (imdbIdRe.test(id)) {
      url = urlPrefix + id;
    }

    if (!count) count = 10;

    let options = {
      transform: function(body) {
        return cheerio.load(body);
      }
    };
    return rp(url, options)
    .then(($) => {
      let similarNodes = $('#titleRecs .rec_page .rec_item[data-tconst]');
      let ids = _.map(_.slice(similarNodes, 0, count), (el) => $(el).attr('data-tconst'));
      return Promise.map(ids, (simId) => cachedMovie.getById(simId))
        .then((results) => Promise.resolve(_.compact(results)));
    });
  }

  return {
    getSimilar: getSimilar
  };
};
