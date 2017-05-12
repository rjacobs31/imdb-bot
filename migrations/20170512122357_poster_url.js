
exports.up = function(knex, Promise) {
  return knex.schema.table('cached_movie', (table) => {
    table.string('poster');
  });
};

exports.down = function(knex, Promise) {
  return knex('cached_movie').dropColumn('poster');
};
