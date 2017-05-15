const imdb = require('imdb-api');

const patterns = {
  affirmative: /please|yes|yup/i,
  empty: /^[\s\p{Z}]*$/,
  greeting: /h[ae]llo|hi/i,
  negative: /no|nope|nah/i
};

module.exports = function(bp) {
  const cachedMovie = require('../utils/cached_movie')(bp);

  bp.hear({platform: 'facebook', text: patterns.greeting}, (event) => {
    const txt = txt => bp.messenger.createText(event.user.id, txt);

    bp.convo.start(event, (convo) => {
      convo.threads['default'].addMessage(txt('Hello! This is an example conversation.'));
      convo.threads['default'].addQuestion(txt('Would you like to look up a movie?'), [
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
              convo.set('imdbid', movie.imdbid);
              convo.say(txt('Found it!'));
              await cachedMovie.upsert(movie);
              convo.say(txt(movie.title));
            } else {
              convo.say(txt('Sorry, but I couldn\'t find a movie like that.'));
            }
          }
        }
      ]);

      convo.on('done', () => {
        convo.say(txt('Thanks for the conversation! Good talk.'));
      });
    });
  });
};
