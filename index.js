module.exports = function(bp) {
  const _ = require('lodash');
  const imdb = require('imdb-api');
  const similar = require('./utils/similar_search');

  const imdbBaseUrl = 'https://www.imdb.com/title/';

  bp.middlewares.load();

  // Ensure all DB migrations have run
  bp.db.get().then(knex => {
    knex.migrate.latest({'directory': bp.projectLocation + '/migrations'});
  });

  bp.hear({platform: 'facebook', type: 'message'}, (event) => {
    bp.messenger.sendText(event.user.id, 'Roger. Give me a second to look for "' + event.text + '".');
    imdb.get(event.text)
      .then((result) => {
        if (result) {
          let fields = [
            'Title: ' + result.title,
            'Rated: ' + result.rated,
            'Rating: ' + result.rating,
            'Running time: ' + result.runtime,
            'Genres: ' + result.genres
          ];

          let buttons = [
            {
              type: 'web_url',
              title: 'Visit IMDb page',
              url: imdbBaseUrl + result.imdbid
            },
            {
              type: 'postback',
              title: 'Get plot info',
              payload: 'plot:' + result.imdbid
            },
            {
              type: 'postback',
              title: 'Get similar movies',
              payload: 'similar:' + result.imdbid
            }
          ];

          let payload = {
            template_type: 'button',
            text: _.join(fields, '\n'),
            buttons: buttons
          };
          bp.messenger.sendTemplate(event.user.id, payload);
        }
      })
    .catch(() => {
      bp.messenger.sendText(event.user.id, 'I couldn\'t find a movie like that. Sorry.');
    });
  });

  const reSimilarPostback = /^similar:/i;
  bp.hear({platform: 'facebook', type: 'postback', text: reSimilarPostback}, (event) => {
    bp.db.get()
      .then((knex) => {
        return similar.getSimilar(knex, _.replace(event.text, reSimilarPostback, ''))
          .then((movies) => {
            if (_.isEmpty(movies)) {
              return bp.messenger.sendText('Sorry, but I couldn\'t find similar movies.');
            }
            const maxElements = 10;
            let elements = _.map(_.slice(movies, 0, maxElements), (movie) => {
              return {title: movie.title, subtitle: 'Rating: ' + movie.rating};
            });
            let payload = {
              template_type: 'generic',
              elements: elements
            };
            bp.messenger.sendTemplate(event.user.id, payload);
          });
      });
  });

  const reFind = /^\s*find\s+/i;
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
                },
                {
                  title: 'IMDb ID',
                  value: result.imdbid
                }
              ]
            },
            {
              text: 'To find similar movies, type "similar ' + result.imdbid + '" (without the quotes)'
            }
          ]);
        }
      })
    .catch(() => {
      bp.slack.sendText(event.channel.id, 'I couldn\'t find a movie like that. Sorry.');
    });
  });

  const reSimilar = /^\s*similar\s+/i;
  bp.hear({platform: 'slack', type: 'message', direct: true, text: reSimilar}, (event, next) => {
    let query = event.text.replace(reSimilar, '');
    if (!query) next();

    bp.slack.sendText(event.channel.id, 'Searching for similar movies');
    similar.getSimilar(query)
      .then((similarMovies) => {
        if (similarMovies) {
          let idArr = [];
          for (let idx in similarMovies) {
            let movie = similarMovies[idx];
            idArr.push(movie.title + ' (' + movie.imdbid + ')');
          }
          bp.slack.sendText(event.channel.id, idArr.join(', '));
        }
      })
      .catch(() => {
        bp.slack.sendText(event.channel.id, 'I couldn\'t find a movie like that. Sorry.');
      });
  });
};
