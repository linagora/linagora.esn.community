module.exports = dependencies => {
  const community = require('./community')(dependencies);
  const communityArchive = require('./community-archive');

  return {
    community,
    communityArchive
  };
};
