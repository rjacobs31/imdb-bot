
exports.up = function(knex, Promise) {
  return knex.schema.hasColumn('cached_movie', 'created_at')
    .then((hasCol) => {
      if (hasCol) {
        return knex.schema.table('cached_movie', (table) => {
          table.dropColumn('created_at');
        });
      } else {
        return Promise.resolve();
      }
    })
    .then(() => {
      return knex.schema.hasColumn('cached_movie', 'updated_at')
        .then((hasCol) => {
          if (hasCol) {
            return knex.schema.table('cached_movie', (table) => {
              table.dropColumn('updated_at');
            });
          } else {
            return Promise.resolve();
          }
        });
    })
    .then(() => {
      return knex.schema.table('cached_movie', (table) => {
        table.timestamps(true);
        table.timestamp('released');
      });
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.hasColumn('cached_movie', 'released')
    .then((hasCol) => {
      if (hasCol) {
        return knex('cached_movie').dropColumn('released');
      } else {
        return Promise.resolve();
      }
    });
};
