
exports.up = function(knex, Promise) {
  return knex.schema.table('cached_movie', (table) => {
    table.string('director');
    table.string('writer');
    table.string('actors');
  });
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex('cached_movie').dropColumn('director'),
    knex('cached_movie').dropColumn('writer'),
    knex('cached_movie').dropColumn('actors')
  ]);
};
