module.exports = dependencies => {
  const CONSTANTS = require('./constants');
  const { listeners: elasticsearchListener } = dependencies('elasticsearch');
  const denormalize = require('./denormalize')(dependencies);

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
    elasticsearchListener.addListener(getOptions());
  }
};
