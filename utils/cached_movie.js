let _ = require('lodash');
let imdb = require('imdb-api');
let Promise = require('bluebird');

const imdbIdRe = /^tt[0-9]+$/;

function getById(knex, id) {
  if (!id) return Promise.reject(new Error('ID not set'));

  return knex('cached_movie').where('imdbid', id)
    .then((results) => {
      if (_.isEmpty()) {
        return imdb.getById(id)
          .then((movie) => {
            if (movie) {
              let movieData = _.pick(movie, [
                'imdbid',
                'title',
                'rated',
                'rating',
                'genres',
                'runtime',
                'plot'
              ]);
              return knex('cached_movie').insert(movieData, 'id')
                .then(() => {
                  return Promise.resolve(movie);
                });
            } else {
              return Promise.resolve({});
            }
          });
      } else {
        return Promise.resolve(results[0]);
      }

    });
}

module.exports = {
  getById: getById
};
