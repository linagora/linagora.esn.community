var expect = require('chai').expect;
var sinon = require('sinon');

describe('The community controller #load() method', function() {
  var Community;
  var communityCoreModule;
  var collaborationCoreModule;
  var imageCoreModule;
  var dbCoreModule;

  beforeEach(function() {
    Community = {
      testTitleDomain: sinon.spy(function(title, domains, callback) {
        return callback(null, false);
      })
    };

    communityCoreModule = {};
    collaborationCoreModule = {
      CONSTANT: {
        COLLABORATION_TYPES: {
          OPEN: 'open'
        }
      }
    };
    imageCoreModule = {};
    dbCoreModule = {
      mongo: {
        mongoose: {
          model: function() {
            return Community;
          },
          Types: {
            ObjectId: function() {}
          }
        }
      }
    };

    this.moduleHelpers.addDep('community', communityCoreModule);
    this.moduleHelpers.addDep('collaboration', collaborationCoreModule);
    this.moduleHelpers.addDep('image', imageCoreModule);
    this.moduleHelpers.addDep('db', dbCoreModule);

    this.helpers.mock.models({
      User: function() {},
      Community
    });
  });

  it('should call next with error if community module sends back error on load', function(done) {
    communityCoreModule.load = function(id, callback) {
      return callback(new Error());
    };
    var req = {
      params: {
        id: 123
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.load(req, {}, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back 404 if community can not be found', function(done) {
    communityCoreModule.load = function(id, callback) {
      return callback();
    };

    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(404);
        done();
      }
    );

    var req = {
      params: {
        id: 123
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.load(req, res);
  });

  it('should set req.community when community can be found', function(done) {
    var community = {_id: 123};

    communityCoreModule.load = function(id, callback) {
      return callback(null, community);
    };
    communityCoreModule.member = {
      isMember: function(community, user, callback) {
        return callback(null, true);
      }
    };

    var req = {
      params: {
        id: 123
      },
      user: {
        _id: 1
      }
    };
    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.load(req, {}, function(err) {
      expect(err).to.not.exist;
      expect(req.community).to.exist;
      expect(req.community).to.deep.equal(community);
      done();
    });
  });

  it('should send back members array', function(done) {
    var community = {_id: 123, members: [1, 2, 3]};

    communityCoreModule.load = function(id, callback) {
      return callback(null, community);
    };
    communityCoreModule.member = {
      isMember: function(community, user, callback) {
        return callback(null, true);
      }
    };

    var req = {
      params: {
        id: 123
      },
      user: {
        id: 1
      }
    };
    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.load(req, {}, function(err) {
      expect(err).to.not.exist;
      expect(req.community).to.exist;
      expect(req.community.members).to.deep.equal([1, 2, 3]);
      done();
    });
  });
});
