const _ = require('lodash');

const imdbBaseUrl = 'https://www.imdb.com/title/';

module.exports = function(bp) {
  const imdb = require('imdb-api');

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
};
