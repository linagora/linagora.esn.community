const { EVENTS } = require('./constants');

module.exports = dependencies => {
  const mongoose = dependencies('db').mongo.mongoose;
  let CommunityArchive;

  try {
    CommunityArchive = mongoose.model('CommunityArchive');
  } catch (err) {
    CommunityArchive = require('./models/community-archive')(dependencies);
  }

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
