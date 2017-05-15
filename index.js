module.exports = function(bp) {
  bp.middlewares.load();

  // Ensure all DB migrations have run
  bp.db.get().then(knex => {
    knex.migrate.latest({'directory': bp.projectLocation + '/migrations'});
  });

  require('./messenger/index')(bp);

  bp.hear({platform: 'facebook', text: /help/}, (event, next) => {
    bp.messenger.sendText(event.user.id, 'I\'m a very simple bot at the moment, so I may not understand everything you want.', {typing: 500})
      .then(() => {
        bp.messenger.sendText(event.user.id, 'You can type the name of a movie and I will try to find it for you.', {typing: 500});
      })
      .then(() => {
        bp.messenger.sendText(event.user.id, 'Once I\'ve found a movie for you, you will be able to find out more about it by clicking buttons.', {typing: 500});
        next();
      });
  });
};
