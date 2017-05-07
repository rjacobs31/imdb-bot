let cheerio = require('cheerio');
let rp = require('request-promise');
let Promise = require('bluebird');

let cachedMovie = require('./cached_movie');

const urlPrefix = 'https://www.imdb.com/title/';
const imdbIdRe = /^tt[0-9]+$/;

function getSimilar(id) {
  let url = id;
  if (!id) return Promise.reject(new Error('ID not set'));
  if (imdbIdRe.test(id)) {
    url = urlPrefix + id;
  }

  let options = {
    transform: function(body) {
      return cheerio.load(body);
    }
  };
  return rp(url, options)
    .then(($) => {
      let similarNodes = $('#titleRecs .rec_page .rec_item[data-tconst]');
      let ids = [];
      similarNodes.each((i, el) => {
        ids[i] = $(el).attr('data-tconst');
      });

      return Promise.map(ids, (simId) => {
        return cachedMovie.getById(simId);
      });
    });
}

module.exports = {
  getSimilar: getSimilar
};
