var expect = require('chai').expect;
var sinon = require('sinon');

describe('getMember fn', function() {
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

  it('should send back 400 is req.community is undefined', function(done) {
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var req = {
      params: {
        user_id: 1
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMember(req, res);
  });

  it('should send back 500 is communityModule.isMember returns error', function(done) {
    communityCoreModule.member = {
      isMember: function(comm, user, callback) {
        return callback(new Error());
      }
    };

    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(500);
        done();
      }
    );

    var req = {
      community: {
        _id: 2
      },
      params: {
        user_id: 1
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMember(req, res);
  });

  it('should send back 200 is communityModule.isMember returns result', function(done) {
    communityCoreModule.member = {
      isMember: function(comm, user, callback) {
        return callback(null, []);
      }
    };

    var res = this.helpers.express.response(
      function(code) {
        expect(code).to.equal(200);
        done();
      }
    );

    var req = {
      community: {
        _id: 2
      },
      params: {
        user_id: 1
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMember(req, res);
  });

  it('should send back 404 is communityModule.isMember returns nothing', function(done) {
    communityCoreModule.member = {
      isMember: function(comm, user, callback) {
        return callback();
      }
    };

    var res = this.helpers.express.response(
      function(code) {
        expect(code).to.equal(404);
        done();
      }
    );

    var req = {
      community: {
        _id: 2
      },
      params: {
        user_id: 1
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMember(req, res);
  });
});
