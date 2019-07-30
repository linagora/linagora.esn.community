module.exports = dependencies => {
  const mongoose = dependencies('db').mongo.mongoose;

  const CommunityArchiveSchema = {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamps: {
      creation: { type: Date, default: Date.now }
    },
    source: mongoose.Schema.Types.Mixed
  };

  return mongoose.model('CommunityArchive', CommunityArchiveSchema);
};
