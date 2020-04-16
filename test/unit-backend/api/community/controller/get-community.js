const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');

describe('The community controller #get method', function() {
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

    mockery.registerMock('../../../lib', () => communityCoreModule);
    this.moduleHelpers.addDep('collaboration', collaborationCoreModule);
    this.moduleHelpers.addDep('image', imageCoreModule);
    this.moduleHelpers.addDep('db', dbCoreModule);

    this.helpers.mock.models({
      User: function() {},
      Community
    });
  });

  it('should send back HTTP 200 with community if defined in request', function(done) {
    var community = {_id: 123, members: [{member: {objectType: 'user', id: 'user1'}}]};
    var user = {_id: 'user1', id: 'user1'};

    communityCoreModule.member = {
      getMembershipRequest: function() {
      },
      isMember: function(community, tuple, callback) {
        callback(null, true);
      }
    };
    communityCoreModule.permission = {
      canWrite: function(community, user, callback) {
        callback(null, true);
      },
      canFind: function(com, tuple, callback) {
        expect(com).to.deep.equal(community);
        callback(null, true);
      }
    };

    var req = {
      community: community,
      user: user
    };
    var res = {
      status: function(code) {
        expect(code).to.equal(200);

        return this;
      },
      json: function(result) {
        expect(result).to.deep.equal({ _id: 123, members_count: 1, members_invitations_count: 0, members_requests_count: 0, member_status: 'member', writable: true });
        done();
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.get(req, res);
  });

  it('should send back HTTP 403 if community is not readable by the user', function(done) {
    var community = {_id: 123, members: [{id: 'user1'}]};

    var user = {_id: 'user1'};

    var req = {
      community: community,
      user: user
    };

    var res = {
      status: function(code) {
        expect(code).to.equal(403);

        return this;
      },
      json: function() {
        done();
      }
    };

    communityCoreModule.permission = {
      canFind: function(com, tuple, callback) {
        expect(com).to.deep.equal(community);

        return callback(null, false);
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.get(req, res);
  });

  it('should send back HTTP 404 if community is not set in request', function(done) {
    var req = {};
    var res = {
      status: function(code) {
        expect(code).to.equal(404);

        return this;
      },
      json: function() {
        done();
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.get(req, res);
  });
});
