module.exports = function(bp) {
  bp.hear({platform: 'facebook', text: /h[ae]llo|hi/i}, (event) => {
    const txt = txt => bp.messenger.createText(event.user.id, txt);

    bp.convo.start(event, (convo) => {
      convo.threads['default'].addMessage(txt('Hello! This is an example conversation.'));

      convo.on('done', () => {
        convo.say(txt('Thanks for the conversation!. Good talk.'));
      });
    });
  });
};
