
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('cached_movie', function(table) {
    table.increments();
    table.string('imdbid', 12);
    table.timestamps();
    table.string('title');
    table.string('rated', 5);
    table.string('rating', 5);
    table.string('genres');
    table.string('runtime', 20);
    table.text('plot');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfTableExists('cached_movie');
};
