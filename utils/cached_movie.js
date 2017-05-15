const _ = require('lodash');
const imdb = require('imdb-api');
const Promise = require('bluebird');

const fieldList = [
  'imdbid',
  'title',
  'rated',
  'rating',
  'genres',
  'runtime',
  'plot',
  'poster'
];

module.exports = function(bp){
  function getById(id) {
    if (!id) return Promise.reject(new Error('ID not set'));
    let knex = null;

    return bp.db.get()
      .then((knexInstance) => {
        knex = knexInstance;
        return knex.select().from('cached_movie').where('imdbid', id);
      })
      .then((results) => {
        if (_.isEmpty(results)) {
          return imdb.getById(id)
            .then((movie) => {
              if (movie) {
                let movieData = _.pick(movie, fieldList);
                return knex('cached_movie').insert(movieData, 'id')
                  .then(() => {
                    return Promise.resolve(movie);
                  });
              } else {
                return Promise.resolve();
              }
            })
            .catch(() => Promise.resolve());
        } else {
          return Promise.resolve(results[0]);
        }
      });
  }

  function upsert(movie) {
    if (!movie) return Promise.reject('Attempt to insert empty movie.');
    let knex = null;

    return bp.db.get()
      .then((knexInstance) => {
        knex = knexInstance;
        return knex.select().from('cached_movie').where('imdbid', movie.imdbid);
      })
      .then((oldMovies) => {
        if (oldMovies) {
          return knex('cached_movie').where('imdbid', movie.imdbid).update(movie, 'id');
        } else {
          let movieData = _.pick(movie, fieldList);
          return knex('cached_movie').insert(movieData, 'id');
        }
      })
      .then(() => {
        return Promise.resolve(movie);
      });
  }

  return {
    getById: getById,
    upsert: upsert
  };
};
