module.exports = function(bp) {
  require('./conversation')(bp);
  require('./search')(bp);
  require('./postback')(bp);
};
