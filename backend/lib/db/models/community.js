'use strict';

module.exports = dependencies => {
  var mongoose = require('mongoose');
  const baseCollaboration = dependencies('db').mongo.models['base-collaboration'];
  var ObjectId = mongoose.Schema.ObjectId;

  var communityJSON = {
    title: {type: String, required: true, trim: true},
    description: {type: String, trim: true},
    type: {type: String, trim: true, required: true, default: 'open'},
    status: String,
    avatar: ObjectId,
    membershipRequests: [
      {
        user: {type: ObjectId, ref: 'User'},
        workflow: {type: String, required: true},
        timestamp: {
          creation: {type: Date, default: Date.now}
        }
      }
    ]
  };

  var CommunitySchema = baseCollaboration(communityJSON, 'community');

  CommunitySchema.statics.testTitleDomain = function(title, domains, cb) {
    var query = {title: title, domain_ids: domains};
    this.findOne(query, cb);
  };

  return mongoose.model('Community', CommunitySchema);
};
