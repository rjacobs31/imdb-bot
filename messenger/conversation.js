const _ = require('lodash');
const imdb = require('imdb-api');
const chunk = require('../utils/text_chunking');

const msgMaxLen = 300;

const patterns = {
  abort: /abort|cancel|stop/i,
  affirmative: /please|yes|yup/i,
  empty: /^[\s\p{Z}]*$/,
  greeting: /h[ae]llo|hi/i,
  negative: /no|nope|nah/i
};

module.exports = function(bp) {
  const cachedMovie = require('../utils/cached_movie')(bp);

  bp.hear({platform: 'facebook', text: patterns.greeting}, (event) => {
    if (bp.convo.find(event)) return;
    const txt = (txt, options) => bp.messenger.createText(event.user.id, txt, options);

    bp.convo.start(event, (convo) => {
      convo.messageTypes = ['text', 'message', 'quick_reply'];

      const greetOptions = {
        quick_replies: [
          {content_type: 'text', title: 'Yes', payload: 'yes'},
          {content_type: 'text', title: 'No', payload: 'no'}
        ]
      };
      convo.threads['default'].addMessage(txt('Hello! I\'m IMDb Bot.'));
      convo.threads['default'].addMessage(txt('I\'m here to help you find movies.'));
      convo.threads['default'].addQuestion(txt('Would you like to look up a movie?', greetOptions), [
        {
          pattern: patterns.affirmative,
          callback: () => {
            convo.set('type', 'movie_search');
            convo.say(txt('Great! We can do that.'));
            convo.switchTo('search');
          }
        },
        {
          default: true,
          callback: () => {
            convo.say(txt('Sorry. I don\'t know what you want, then.'));
            convo.next();
          }
        }
      ]);

      convo.createThread('search');
      convo.threads['search'].addQuestion(txt('Which movie do you want to look up?'), [
        {
          pattern: patterns.empty,
          callback: () => {
            convo.say(txt('Sorry, but I can\'t search for a movie without a title.'));
            convo.repeat();
          }
        },
        {
          default: true,
          callback: async function(ev) {
            let title = ev.text;
            let movie = null;
            convo.say(txt('Great, I\'ll search for that in a moment.'));
            movie = await imdb.get(title);
            if (movie) {
              convo.set('movie', movie);
              convo.say(txt('Found it!'));
              await cachedMovie.upsert(movie);
              let sentences = [];

              if ('title' in movie) {
                sentences.push(`The movie is titled "${movie.title}".`);
              }

              if ('runtime' in movie && 'rated' in movie) {
                sentences.push(`It\'s ${movie.runtime} long and is rated ${movie.rated}.`);
              } else if ('runtime' in movie) {
                sentences.push(`It\'s ${movie.runtime} long.`);
              } else if ('rated' in movie) {
                sentences.push('It\'s rated ${movie.rated}.');
              }

              if ('rating' in movie) {
                sentences.push(`It has a rating of ${movie.rating}.`);
              }

              convo.say(txt(_.join(sentences, ' ')));
              convo.switchTo('movie_actions');
            } else {
              convo.say(txt('Sorry, but I couldn\'t find a movie like that.'));
              convo.next();
            }
          }
        }
      ]);

      convo.createThread('movie_actions');
      convo.threads['movie_actions'].addMessage(txt(
        'Now that we have a movie, there are several things we can do.'
      ));
      convo.threads['movie_actions'].addMessage(
        txt('I can get you the *plot* of the movie.')
      );
      const actionsOptions = {
        quick_replies: [
          {content_type: 'text', title: 'Get plot', payload: 'plot'}
        ]
      };
      const actionsMessage = txt('What would you like to do?', actionsOptions);
      convo.threads['movie_actions'].addQuestion(actionsMessage, [
        {
          default: true,
          callback: () => {
            convo.say(txt('Sorry, I\'m still learning to understand humans. Please try again.'));
            convo.repeat();
          }
        },
        {
          pattern: patterns.abort,
          callback: () => {
            convo.stop('done');
          }
        },
        {
          pattern: /plot/i,
          callback: () => {
            let movie = convo.get('movie');
            if ('plot' in movie && _.isString(movie.plot)) {
              let sentences = chunk.chunkStr(movie.plot, msgMaxLen);
              _.forEach(sentences, (val) => {
                convo.say(txt(val));
              });
            } else {
              convo.say(txt(`It turns out I don\'t have a detailed plot for "${movie.title}". Sorry!`));
            }
            convo.repeat();
          }
        }
      ]);

      convo.on('done', () => {
        convo.say(txt('Thanks for the conversation! Good talk.'));
      });
    });
  });
};
