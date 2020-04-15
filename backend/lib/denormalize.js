module.exports = dependencies => {
  let Community;

  try {
    Community = dependencies('db').mongo.mongoose.model('Community');
  } catch (err) {
    Community = require('./models/community')(dependencies);
  }

  return {
    denormalize,
    getId
  };

  function denormalize(community) {
    function transform(doc, ret) {
      ret.id = getId(ret);
      delete ret._id;
    }
    var options = {virtuals: true, transform: transform};

    return community instanceof Community ? community.toObject(options) : new Community(community).toObject(options);
  }

  function getId(community) {
    return community._id;
  }
};
