module.exports = function(dependencies) {
  const models = require('./db')(dependencies);

  return {
    models
  };
};
