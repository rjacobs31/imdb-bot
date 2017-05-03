module.exports = function(bp) {
  bp.middlewares.load();

  bp.hear({platform: 'slack', type: 'message', direct: true})
    .then((event, next) => {
      bp.slack.sendText(event.channel.id, 'Hi, there!');
      if (next) next();
    });
};
