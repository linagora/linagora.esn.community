module.exports = dependencies => {
  const CONSTANTS = require('./constants');
  const { listeners } = dependencies('elasticsearch');
  const denormalize = require('./denormalize');

  return {
    getOptions,
    register
  };

  function getOptions() {
    return {
      events: {
        add: CONSTANTS.EVENTS.communityCreated,
        update: CONSTANTS.EVENTS.communityUpdated,
        remove: CONSTANTS.EVENTS.communityDeleted
      },
      denormalize: denormalize.denormalize,
      getId: denormalize.getId,
      type: CONSTANTS.ELASTICSEARCH.type,
      index: CONSTANTS.ELASTICSEARCH.index
    };
  }

  function register() {
    listeners.addListener(getOptions());
  }
};
