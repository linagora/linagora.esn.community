var expect = require('chai').expect;
var sinon = require('sinon');

describe('The community controller #removeMembershipRequest method', function() {
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

  it('should send back 400 if req.community is undefined', function(done) {
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var req = {
      user: {},
      params: {
        user_id: {}
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.removeMembershipRequest(req, res);
  });

  it('should send back 400 if req.user is undefined', function(done) {
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var req = {
      community: {},
      params: {
        user_id: {}
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.removeMembershipRequest(req, res);
  });

  it('should send back 400 if the user_id parameter is undefined', function(done) {
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var req = {
      community: {},
      user: {}
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.removeMembershipRequest(req, res);
  });

  describe('When current user is not community manager', function() {
    it('should send back 403 when req.params.user_id is not the current user id', function(done) {
      var res = this.helpers.express.jsonResponse(
        function(code, err) {
          expect(code).to.equal(403);
          expect(err.error.details).to.match(/Current user is not the target user/);
          done();
        }
      );

      var req = {
        community: {_id: '1'},
        user: {
          _id: {
            equals: function() {
              return false;
            }
          }
        },
        params: {
          user_id: '2'
        }
      };

      var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

      communities.removeMembershipRequest(req, res);
    });

    it('should send back 500 if communityModule#removeMembershipRequest fails', function(done) {
      communityCoreModule.member = {
        cancelMembershipRequest: function(community, membership, user, onResponse) {
          onResponse(new Error('community module error'));
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
          _id: '1',
          membershipRequests: [
            {
              user: {equals: function() {return true;}},
              workflow: 'request'
            }
          ]
        },
        user: {
          _id: {
            equals: function() {
              return true;
            }
          }
        },
        params: {
          user_id: '2'
        }
      };

      var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

      communities.removeMembershipRequest(req, res);
    });

    it('should send 204 if communityModule#removeMembershipRequest succeeds', function(done) {
      communityCoreModule.member = {
        removeMembershipRequest: function(community, user, target, workflow, actor, callback) {
          callback(null, {});
        }
      };

      var res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(204);
          done();
        }
      );

      var req = {
        community: {
          _id: '1',
          membershipRequests: [
            {user: this.helpers.objectIdMock('anotherUserrequest')}
          ]},
        user: {
          _id: {
            equals: function() {
              return true;
            }
          }
        },
        params: {
          user_id: this.helpers.objectIdMock('2')
        }
      };

      var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

      communities.removeMembershipRequest(req, res);
    });
  });

  describe('when current user is community manager', function() {
    it('should send back 500 when refuseMembershipRequest fails', function(done) {
      communityCoreModule.member = {
        refuseMembershipRequest: function(community, user, foo, callback) {
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
        isCommunityManager: true,
        community: {
          _id: '1',
          membershipRequests: [
            {
              user: {equals: function() {return true;}},
              workflow: 'request'
            }
          ]
        },
        user: {
          _id: {
            equals: function() {
              return false;
            }
          }
        },
        params: {
          user_id: '2'
        }
      };

      var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

      communities.removeMembershipRequest(req, res);
    });

    it('should send back 204 when removeMembershipRequest is ok', function(done) {
      communityCoreModule.member = {
        removeMembershipRequest: function(community, user, target, workflow, actor, callback) {
          return callback();
        }
      };

      var res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(204);
          done();
        }
      );

      var req = {
        isCommunityManager: true,
        community: {_id: '1'},
        user: {
          _id: {
            equals: function() {
              return false;
            }
          }
        },
        params: {
          user_id: '2'
        }
      };

      var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

      communities.removeMembershipRequest(req, res);
    });
  });
});
