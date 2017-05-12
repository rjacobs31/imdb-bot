module.exports = function(bp) {
  const _ = require('lodash');
  const imdb = require('imdb-api');

  const imdbBaseUrl = 'https://www.imdb.com/title/';

  bp.middlewares.load();

  // Ensure all DB migrations have run
  bp.db.get().then(knex => {
    knex.migrate.latest({'directory': bp.projectLocation + '/migrations'});
  });

  const cachedMovie = require('./utils/cached_movie')(bp);
  const similar = require('./utils/similar_search')(bp);

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

  bp.hear({platform: 'facebook', type: 'message'}, (event) => {
    bp.messenger.sendText(event.user.id, 'Roger. Give me a second to look for "' + event.text + '".');
    imdb.get(event.text)
      .then((result) => {
        if (result) {
          bp.messenger.sendText('Here\'s that movie you wanted.');
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
          if ('poster' in result) {
            bp.messenger.sendAttachment(event.user.id, 'image', result.poster, {typing: 2000, waitDelivery: true})
              .then(() => {
                bp.messenger.sendTemplate(event.user.id, payload);
              });
          } else {
            bp.messenger.sendTemplate(event.user.id, payload);
          }
        }
      })
    .catch(() => {
      bp.messenger.sendText(event.user.id, 'I couldn\'t find a movie like that. Sorry.');
    });
  });

  bp.hear({platform: 'facebook', type: 'postback', text: 'GET_STARTED'}, (event) => {
    bp.messenger.sendText(event.user.id, 'Hi, there! Type any movie title to start.');
  });

  const reBasicPostback = /^basic:/i;
  bp.hear({platform: 'facebook', type: 'postback', text: reBasicPostback}, (event) => {
    cachedMovie.getById(_.replace(event.text, reBasicPostback, ''))
      .then((result) => {
        if (result) {
          if ('poster' in result) {
            bp.messenger.sendAttachment(event.user.id, 'image', result.poster, {typing: 2000, waitDelivery: true});
          }
          let fields = [
            'Title: ' + result.title,
            'Rated: ' + result.rated,
            'Rating: ' + result.rating,
            'Running time: ' + result.runtime,
            'Genres: ' + result.genres
          ];

          let buttons = [
            { type: 'web_url', title: 'Visit IMDb page', url: imdbBaseUrl + result.imdbid },
            { type: 'postback', title: 'Get plot info', payload: 'plot:' + result.imdbid },
            { type: 'postback', title: 'Get similar movies', payload: 'similar:' + result.imdbid }
          ];

          let payload = {
            template_type: 'button',
            text: _.join(fields, '\n'),
            buttons: buttons
          };
          bp.messenger.sendTemplate(event.user.id, payload);
        }
      });
  });

  const rePlotPostback = /^plot:/i;
  bp.hear({platform: 'facebook', type: 'postback', text: rePlotPostback}, (event) => {
    cachedMovie.getById(_.replace(event.text, rePlotPostback, ''))
      .then((result) => {
        if (result) {
          let buttons = [
            { type: 'web_url', title: 'Visit IMDb page', url: imdbBaseUrl + result.imdbid },
            { type: 'postback', title: 'Get basic info', payload: 'basic:' + result.imdbid },
            { type: 'postback', title: 'Get similar movies', payload: 'similar:' + result.imdbid }
          ];

          let payload = {
            template_type: 'button',
            text: result.title + '\n' + _.truncate(result.plot, {length: 630}),
            buttons: buttons
          };
          bp.messenger.sendTemplate(event.user.id, payload);
        }
      });
  });

  const reSimilarPostback = /^similar:/i;
  bp.hear({platform: 'facebook', type: 'postback', text: reSimilarPostback}, (event) => {
    similar.getSimilar(_.replace(event.text, reSimilarPostback, ''))
      .then((movies) => {
        if (_.isEmpty(movies)) {
          return bp.messenger.sendText(event.user.id, 'Sorry, but I couldn\'t find similar movies.');
        }
        const maxElements = 10;
        let elements = _.map(_.slice(movies, 0, maxElements), (movie) => {
          return {
            title: movie.title,
            image_url: ('poster' in movie ? movie.poster : null),
            subtitle: 'Rating: ' + movie.rating,
            buttons: [
              { type: 'postback', title: 'Get info', payload: 'basic:' + movie.imdbid },
              { type: 'web_url', title: 'Visit IMDb page', url: imdbBaseUrl + movie.imdbid }
            ]
          };
        });
        let payload = {
          template_type: 'generic',
          image_aspect_ratio: 'square',
          elements: elements
        };
        bp.messenger.sendTemplate(event.user.id, payload);
      });
  });
};
