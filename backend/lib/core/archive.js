module.exports = dependencies => {
  const mongoose = dependencies('db').mongo.mongoose;
  const CommunityArchive = mongoose.model('CommunityArchive');
  const { EVENTS } = require('./constants');
  const localpubsub = dependencies('pubsub').local;

  return {
    process
  };

  function process(community, user) {
    const archive = new CommunityArchive({ _id: community._id, creator: user, source: community });

    return archive.save()
      .then(() => community.remove())
      .then(() => {
        localpubsub.topic(EVENTS.communityArchived).publish({ community, user });
      });
  }
};
