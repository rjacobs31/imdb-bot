module.exports = function(bp) {
  const imdb = require('imdb-api');
  const similar = require('./utils/similar_search');

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
                  title: 'IMDB page',
                  value: result.imdburl
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

  const reSimilar = /^\s*similar /i;
  bp.hear({platform: 'slack', type: 'message', direct: true, text: reSimilar}, (event, next) => {
    let query = event.text.replace(reSimilar, '');
    if (!query) next();

    bp.slack.sendText(event.channel.id, 'Searching for similar movies');
    similar.getSimilar('tt0241527')
      .then((similarMovies) => {
        if (similarMovies) {
          bp.slack.sendText(event.channel.id, similarMovies.join(', '));
        }
      })
      .catch(() => {
        bp.slack.sendText(event.channel.id, 'I couldn\'t find a movie like that. Sorry.');
      });
  });
};
