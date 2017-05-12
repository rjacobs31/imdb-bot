let _ = require('lodash');
let imdb = require('imdb-api');
let Promise = require('bluebird');

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
                let movieData = _.pick(movie, [
                  'imdbid',
                  'title',
                  'rated',
                  'rating',
                  'genres',
                  'runtime',
                  'plot',
                  'poster'
                ]);
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

  return {
    getById: getById
  };
};
