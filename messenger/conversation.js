module.exports = function(bp) {
  bp.hear({platform: 'facebook', text: /h[ae]llo|hi/i}, (event) => {
    const txt = txt => bp.messenger.createText(event.user.id, txt);

    bp.convo.start(event, (convo) => {
      convo.threads['default'].addMessage(txt('Hello! This is an example conversation.'));
      convo.threads['default'].addQuestion(txt('Would you like to look up a movie?'), [
        {
          pattern: /please|yes|yup/i,
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
          pattern: '^$',
          callback: () => {
            convo.say(txt('Sorry, but I can\'t search for a movie without a title.'));
            convo.repeat();
          }
        },
        {
          default: true,
          callback: () => {
            convo.say(txt('Great, I\'ll search for that in a moment.'));
            convo.next();
          }
        }
      ]);

      convo.on('done', () => {
        convo.say(txt('Thanks for the conversation! Good talk.'));
      });
    });
  });
};
