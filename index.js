module.exports = function(bp) {
  const imdb = require('imdb-api');

  bp.middlewares.load();

  const reFind = /^\s*find /i;
  bp.hear({platform: 'slack', type: 'message', direct: true, text: reFind}, (event, next) => {
    let query = event.text.replace(reFind, '');
    if (!query) next();

    imdb.get(query)
      .then((result) => {
        if (result) {
          bp.slack.sendAttachments(event.channel.id, [
            {
              title: result.title,
              fields: [
                {
                  title: 'Rated',
                  value: result.rated,
                  short: 'true'
                },
                {
                  title: 'Rating',
                  value: result.rating,
                  short: true
                },
                {
                  title: 'Genres',
                  value: result.genres
                },
                {
                  title: 'Plot',
                  value: result.plot
                }
              ]
            }
          ]);
        }
      })
    .catch(() => {
      bp.slack.sendText(event.channel.id, 'I couldn\'t find a movie like that. Sorry.');
    });
  });
};
