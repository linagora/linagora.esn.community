var expect = require('chai').expect;
var sinon = require('sinon');

describe('The community controller #join function', function() {
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

    communities.join(req, res);
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

    communities.join(req, res);
  });

  it('should send back 400 if req.params.user_id is undefined', function(done) {
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var req = {
      user: {},
      community: {}
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.join(req, res);
  });

  describe('when current user is community manager', function() {
    it('should send back 400 when current user ID is equals to req.params.user_id', function(done) {
      var res = this.helpers.express.jsonResponse(
        function(code, err) {
          expect(code).to.equal(400);
          expect(err.error.details).to.match(/Community Manager can not add himself to a community/);
          done();
        }
      );

      var req = {
        isCommunityManager: true,
        user: {
          _id: {
            equals: function() {
              return true;
            }
          }
        },
        community: {},
        params: {
          user_id: 123
        }
      };

      var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

      communities.join(req, res);
    });

    it('should send back 400 when user_id is not a membership request', function(done) {
      communityCoreModule.member = {
        getMembershipRequest: function() {
          return false;
        }
      };

      var res = this.helpers.express.jsonResponse(
        function(code, err) {
          expect(code).to.equal(400);
          expect(err.error.details).to.match(/User did not request to join community/);
          done();
        }
      );

      var req = {
        isCommunityManager: true,
        user: {
          _id: {
            equals: function() {
              return false;
            }
          }
        },
        community: {},
        params: {
          user_id: 123
        }
      };

      var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

      communities.join(req, res);
    });

    it('should send back 500 when the membership request can not be deleted', function(done) {
      communityCoreModule.member = {
        getMembershipRequest: function() {
          return true;
        },
        cleanMembershipRequest: function(community, user, callback) {
          return callback(new Error());
        }
      };
      communityCoreModule.join = function(community, user, target, actor, callback) {
        return callback();
      };

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      var req = {
        isCommunityManager: true,
        user: {
          _id: {
            equals: function() {
              return false;
            }
          }
        },
        community: {},
        params: {
          user_id: 123
        }
      };

      var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

      communities.join(req, res);
    });

    it('should send back 500 when join fails', function(done) {
      communityCoreModule.member = {
        getMembershipRequest: function() {
          return true;
        }
      };
      communityCoreModule.join = function(community, user, target, actor, callback) {
        return callback(new Error());
      };

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      var req = {
        isCommunityManager: true,
        user: {
          _id: {
            equals: function() {
              return false;
            }
          }
        },
        community: {},
        params: {
          user_id: 123
        }
      };

      var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

      communities.join(req, res);
    });

    it('should send back 204 when join is OK', function(done) {
      communityCoreModule.member = {
        getMembershipRequest: function() {
          return true;
        },
        cleanMembershipRequest: function(community, user, callback) {
          return callback();
        }
      };
      communityCoreModule.join = function(community, user, target, actor, callback) {
        return callback();
      };

      var res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(204);
          done();
        }
      );

      var req = {
        isCommunityManager: true,
        user: {
          _id: {
            equals: function() {
              return false;
            }
          }
        },
        community: {},
        params: {
          user_id: 123
        }
      };

      var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

      communities.join(req, res);
    });
  });

  describe('when user is not a community manager', function() {
    it('should send back 400 when current user ID is not equals to req.params.user_id', function(done) {
      var res = this.helpers.express.jsonResponse(
        function(code, err) {
          expect(code).to.equal(400);
          expect(err.error.details).to.match(/Current user is not the target user/);
          done();
        }
      );

      var req = {
        user: {
          _id: {
            equals: function() {
              return false;
            }
          }
        },
        community: {},
        params: {
          user_id: 123
        }
      };

      var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

      communities.join(req, res);
    });

    describe('when community is not open', function() {
      it('should send back 400 when user did not make a membership request', function(done) {
        communityCoreModule.member = {
          getMembershipRequest: function() {
            return null;
          }
        };

        var res = this.helpers.express.jsonResponse(
          function(code, err) {
            expect(code).to.equal(400);
            expect(err.error.details).to.exist;
            done();
          }
        );

        var req = {
          user: {
            _id: {
              equals: function() {
                return true;
              }
            }
          },
          community: {
            type: 'private'
          },
          params: {
            user_id: 123
          }
        };

        var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

        communities.join(req, res);
      });

      it('should send back 500 if erasing the membership requests fails', function(done) {
        var userId = 123;

        communityCoreModule.member = {
          getMembershipRequest: function() {
            return {user: userId, workflow: 'invitation'};
          },
          cleanMembershipRequest: function(community, user, callback) {
            callback(new Error());
          }
        };
        communityCoreModule.join = function(community, user, target, actor, callback) {
          return callback();
        };

        var res = this.helpers.express.jsonResponse(
          function(code, err) {
            expect(code).to.equal(500);
            expect(err).to.exist;
            done();
          }
        );

        var req = {
          user: {
            _id: {
              equals: function() {
                return true;
              }
            }
          },
          community: {
            type: 'private'
          },
          params: {
            user_id: userId
          }
        };

        var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

        communities.join(req, res);
      });

      it('should send back 500 if adding the user to the community fails', function(done) {
        var userId = 123;

        communityCoreModule.member = {
          getMembershipRequest: function() {
            return {user: userId, workflow: 'invitation'};
          },
          removeMembershipRequest: function(community, userAuthor, userTarget, workflow, actor, callback) {
            callback(null);
          }
        };
        communityCoreModule.join = function(community, userAuthor, userTarget, actor, callback) {
          callback(new Error());
        };

        var res = this.helpers.express.jsonResponse(
          function(code, err) {
            expect(code).to.equal(500);
            expect(err).to.exist;
            done();
          }
        );

        var req = {
          user: {
            _id: {
              equals: function() {
                return true;
              }
            }
          },
          community: {
            type: 'private'
          },
          params: {
            user_id: userId
          }
        };

        var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

        communities.join(req, res);
      });

      it('should send back 204 if the user has been added to the community', function(done) {
        var userId = 123;

        communityCoreModule.member = {
          getMembershipRequest: function() {
            return {user: userId, workflow: 'invitation'};
          },
          cleanMembershipRequest: function(community, user, callback) {
            callback(null);
          }
        };
        communityCoreModule.join = function(community, userAuthor, userTarget, actor, callback) {
          callback(null);
        };

        var res = this.helpers.express.response(
          function(code) {
            expect(code).to.equal(204);
            done();
          }
        );

        var req = {
          user: {
            _id: {
              equals: function() {
                return true;
              }
            }
          },
          community: {
            type: 'private'
          },
          params: {
            user_id: userId
          }
        };

        var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

        communities.join(req, res);
      });
    });

    describe('when community is open', function() {
      it('should send back 500 if community module fails', function(done) {
        communityCoreModule.join = function(community, userAuthor, userTarget, actor, cb) {
          return cb(new Error());
        };

        var res = this.helpers.express.jsonResponse(
          function(code) {
            expect(code).to.equal(500);
            done();
          }
        );

        var req = {
          community: {
            type: 'open'
          },
          user: {
            _id: {
              equals: function() {
                return true;
              }
            }
          },
          params: {
            user_id: {}
          }
        };

        var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

        communities.join(req, res);
      });

      it('should send back 204 if community module succeed', function(done) {
        communityCoreModule.join = function(community, userAuthor, userTarget, actor, cb) {
          return cb();
        };
        communityCoreModule.member = {
          cleanMembershipRequest: function(community, user, cb) {
            return cb(null, community);
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
            type: 'open'
          },
          user: {
            _id: {
              equals: function() {
                return true;
              }
            }
          },
          params: {
            user_id: {}
          }
        };

        var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

        communities.join(req, res);
      });
    });
  });
});
