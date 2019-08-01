module.exports = dependencies => {
  const mongoose = dependencies('db').mongo.mongoose;
  const Community = mongoose.model('Community');

  return {
    denormalize,
    getId
  };

  function denormalize(community) {
    function transform(doc, ret) {
      ret.id = getId(ret);
      delete ret._id;
    }
    const options = { virtuals: true, transform: transform };

    return community instanceof Community ? community.toObject(options) : new Community(community).toObject(options);
  }

  function getId(community) {
    return community._id;
  }
};
