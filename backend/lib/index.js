module.exports = dependencies => {
  const models = require('./db')(dependencies);
  const core = require('./core')(dependencies);

  return {
    models,
    core
  };
};
