'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var mockery = require('mockery');

describe('The community middleware', function() {
  var Community;
  var communityCoreModule;
  var collaborationCoreModule;
  var dbCoreModule;
  var loggerCoreModule;
  var activitystreamMwCoreModule;

  beforeEach(function() {
    Community = {
        testTitleDomain: sinon.spy(function(title, domains, callback) {
          return callback(null, false);
        })
      };

    communityCoreModule = {};
    collaborationCoreModule = {
        CONSTANTS: {
          COLLABORATION_TYPES: {
            OPEN: 'open'
          }
        }
      };
    dbCoreModule = {
        mongo: {
            mongoose: {
                model: function(){
                    return Community
                }
            }
        }
    };
    loggerCoreModule = {};
    activitystreamMwCoreModule = {
        addStreamResourceFinder: function() {},
        addStreamWritableFinder: function() {}
    };

    this.moduleHelpers.addDep("community", communityCoreModule);
    this.moduleHelpers.addDep("collaboration", collaborationCoreModule);
    this.moduleHelpers.addDep("db", dbCoreModule);
    this.moduleHelpers.addDep("logger", loggerCoreModule);
    this.moduleHelpers.addDep("activitystreamMW", activitystreamMwCoreModule);

    this.helpers.mock.models({
      Community: {}
    });
  });

  describe('the canJoin fn', function() {
    it('should send back 400 when req.community is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canJoin;

      var req = {
        user: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when req.user is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canJoin;

      var req = {
        community: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 403 when community is !== open', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canJoin;

      var req = {
        community: {type: 'foo'},
        user: {},
        params: {
          user_id: {}
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(403);
          done();
        }
      );
      middleware(req, res);
    });

    it('should call next if user can join community', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canJoin;

      var req = {
        community: {type: 'open'},
        user: {},
        params: {
          user_id: {}
        }
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      middleware(req, res, done);
    });

  });

  describe('the canLeave fn', function() {
    it('should send back 400 when req.community is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canLeave;

      var req = {
        user: {},
        params: {
          user_id: {}
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when req.user is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canLeave;

      var req = {
        community: {},
        params: {
          user_id: {}
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when req.params.user_id is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canLeave;

      var req = {
        user: {},
        community: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 403 when user is the community creator', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canLeave;
      var req = {
        community: {creator: id},
        user: {_id: id},
        params: {
          user_id: id
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(403);
          done();
        }
      );
      middleware(req, res);
    });

    it('should call next if user can leave community', function(done) {
      var ObjectId = require('bson').ObjectId;
      mockery.registerMock('../../core/community', {});
     var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canLeave;
      var req = {
        community: {creator: new ObjectId()},
        user: {_id: new ObjectId()},
        params: {
          user_id: new ObjectId()
        }
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      middleware(req, res, done);
    });
  });

  describe('requiresCommunityMember fn', function() {
    it('should send back 400 when req.community is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).requiresCommunityMember;
      var req = {
        user: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when req.user is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).requiresCommunityMember;
      var req = {
        community: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when service check fails', function(done) {
      communityCoreModule.member = {
        isMember: function(com, user, callback) {
          return callback(new Error());
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).requiresCommunityMember;
      var req = {
        community: {},
        user: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 403 when user is not a community member', function(done) {
      communityCoreModule.member = {
        isMember: function(com, user, callback) {
          return callback(null, false);
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).requiresCommunityMember;
      var req = {
        community: {},
        user: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(403);
          done();
        }
      );
      middleware(req, res);
    });

    it('should call next if user is a community member', function(done) {
      communityCoreModule.member = {
        isMember: function(com, user, callback) {
          return callback(null, true);
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).requiresCommunityMember;
      var req = {
        community: {},
        user: {}
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      middleware(req, res, done);
    });

  });

  describe('the isCreator fn', function() {
    it('should send back 400 when req.community is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).isCreator;
      var req = {
        user: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when req.user is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).isCreator;
      var req = {
        community: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when user is not the community creator', function(done) {
      var ObjectId = require('bson').ObjectId;
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).isCreator;
      var req = {
        community: {creator: new ObjectId()},
        user: {_id: new ObjectId()}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should call next if user is the community creator', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).isCreator;
      var req = {
        community: {creator: id},
        user: {_id: id}
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      middleware(req, res, done);
    });

  });

  describe('the checkUserIdParameterIsCurrentUser fn', function() {
    it('should send back 400 when req.user is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserIdParameterIsCurrentUser;
      var req = {
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when req.param(user_id) is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserIdParameterIsCurrentUser;
      var req = {
        user: {},
        params: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when user._id is not equal to the user_id parameter', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();

      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserIdParameterIsCurrentUser;
      var req = {
        user: {_id: id},
        params: {
          user_id: new ObjectId()
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should call next if user._id is equal to the user_id parameter', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();

      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserIdParameterIsCurrentUser;
      var req = {
        user: {_id: id},
        params: {
          user_id: '' + id
        }
      };
      var res = this.helpers.express.jsonResponse(
        function() {
          done(new Error());
        }
      );
      middleware(req, res, done);
    });
  });

  describe('the checkUserParamIsNotMember fn', function() {
    it('should send back 400 when req.community is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserParamIsNotMember;
      var req = {
        param: function() {
          return '123';
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when req.param(user_id) is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserParamIsNotMember;
      var req = {
        community: {},
        params: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when service check fails', function(done) {
      communityCoreModule.member = {
        isMember: function(com, user, callback) {
          return callback(new Error());
        }
      };
     var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserParamIsNotMember;
      var req = {
        community: {},
        params: {
          user_id: '123'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when user is already a community member', function(done) {
      communityCoreModule.member = {
        isMember: function(com, user, callback) {
          return callback(null, true);
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserParamIsNotMember;
      var req = {
        community: {},
        params: {
          user_id: '123'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should call next if user is not a community member', function(done) {
      communityCoreModule.member = {
        isMember: function(com, user, callback) {
          return callback(null, false);
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserParamIsNotMember;
      var req = {
        community: {},
        params: {
          user_id: '123'
        }
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      middleware(req, res, done);
    });

  });

  describe('canRead() method', function() {
    it('should call next if the community type is "open"', function(done) {
      communityCoreModule.member = {
        isMember: function() {
          done(new Error('I should not be called'));
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canRead;
      var req = {
        community: { type: 'open' },
        user: {_id: 'user1'}
      };
      var res = {};
      middleware(req, res, done);
    });
    it('should call next if the community type is "restricted"', function(done) {
      communityCoreModule.member = {
        isMember: function() {
          done(new Error('I should not be called'));
        }
      };
      collaborationCoreModule.CONSTANTS.COLLABORATION_TYPES.RESTRICTED = 'restricted';
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canRead;
      var req = {
        community: { type: 'restricted' },
        user: {_id: 'user1'}
      };
      var res = {};
      middleware(req, res, done);
    });
    it('should delegate to isMember middleware if the community type is "private"', function(done) {
      communityCoreModule.member = {
        isMember: function() {
          done();
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canRead;
      var req = {
        community: { type: 'private' },
        user: {_id: 'user1'}
      };
      var res = {};
      var err = function() { done(new Error('I should not be called')); };
      middleware(req, res, err);
    });
    it('should delegate to isMember middleware if the community type is "confidential"', function(done) {
      communityCoreModule.member = {
        isMember: function() {
          done();
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canRead;
      var req = {
        community: { type: 'confidential' },
        user: {_id: 'user1'}
      };
      var res = {};
      var err = function() { done(new Error('I should not be called')); };
      middleware(req, res, err);
    });
  });

  describe('flagCommunityManager() method', function() {
    it('should send back 400 when req.community is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).flagCommunityManager;
      var req = {
        user: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 400 when req.user is not defined', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).flagCommunityManager;
      var req = {
        community: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res);
    });

    it('should send back 500 when community.isManager() failed', function(done) {
      communityCoreModule.member = {
        isManager: function(community, user, callback) {
          return callback(new Error('Fail'));
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).flagCommunityManager;
      var req = {
        community: {},
        user: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );
      middleware(req, res);
    });

    it('should call next with req.isCommunityManager initialized', function(done) {
      communityCoreModule.member = {
        isManager: function(community, user, callback) {
          return callback(null, true);
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).flagCommunityManager;
      var req = {
        community: {},
        user: {}
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      var next = function() {
        expect(req.isCommunityManager).to.be.true;
        done();
      };
      middleware(req, res, next);
    });
  });

  describe('The filterWritableTargets fn', function() {
    it('should call next if targets is not set', function(done) {
      Community.getFromActivityStreamID = function(uuid, cb) {
        return cb(new Error());
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
      var req = {
        body: {
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res, done);
    });

    it('should send back 400 if targets is empty', function(done) {
      Community.getFromActivityStreamID = function(uuid, cb) {
        return cb(new Error());
      };

      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
      var req = {
        body: {
          targets: []
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res, done);
    });

    it('should send back 400 if targets is undefined', function(done) {
      Community.getFromActivityStreamID = function(uuid, cb) {
        return cb(new Error());
      };

      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
      var req = {
        body: {
          targets: undefined
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );
      middleware(req, res, done);
    });

    it('should not filter valid and writable targets', function(done) {
      Community.getFromActivityStreamID = function(uuid, cb) {
        return cb(null, {_id: uuid});
      };

      communityCoreModule.permission = {
        canWrite: function(community, user, callback) {
          return callback(null, true);
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
      var req = {
        user: {},
        body: {
          targets: [
            {
              objectType: 'activitystream',
              id: '1'
            },
            {
              objectType: 'activitystream',
              id: '2'
            }
          ]
        }
      };
      var res = this.helpers.express.jsonResponse(
        function() {
        }
      );
      var next = function() {
        expect(req.body.targets.length).to.equal(2);
        done();
      };
      middleware(req, res, next);
    });

    it('should filter invalid targets and keep writable targets', function(done) {
      Community.getFromActivityStreamID = function(uuid, cb) {
        if (uuid === '1') {
          return cb(null, {_id: uuid});
        } else {
          return cb();
        }
      };
      communityCoreModule.permission = {
        canWrite: function(community, user, callback) {
          return callback(null, true);
        }
      };

      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
      var req = {
        user: {},
        body: {
          targets: [
            {
              objectType: 'activitystream',
              id: '1'
            },
            {
              objectType: 'activitystream',
              id: '2'
            }
          ]
        }
      };
      var res = this.helpers.express.jsonResponse(
        function() {
        }
      );
      var next = function() {
        expect(req.message_targets).to.exist;
        expect(req.message_targets.length).to.equal(1);
        expect(req.message_targets[0].id).to.equal('1');
        done();
      };
      middleware(req, res, next);
    });

    it('should filter unwritable targets', function(done) {
      Community.getFromActivityStreamID = function(uuid, cb) {
        return cb(null, {_id: uuid});
      };
     
      communityCoreModule.permission = {
        canWrite: function(community, user, callback) {
          return callback(null, community._id > 10);
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
      var req = {
        user: {},
        body: {
          targets: [
            {
              objectType: 'activitystream',
              id: 1
            },
            {
              objectType: 'activitystream',
              id: 2
            },
            {
              objectType: 'activitystream',
              id: 3
            },
            {
              objectType: 'activitystream',
              id: 11
            },
            {
              objectType: 'activitystream',
              id: 12
            }
          ]
        }
      };
      var res = this.helpers.express.jsonResponse(
        function() {
          done(new Error());
        }
      );
      var next = function() {
        expect(req.message_targets).to.exist;
        expect(req.message_targets.length).to.equal(2);
        done();
      };
      middleware(req, res, next);
    });

    it('should send back 403 if no valid streams are set', function(done) {
      Community.getFromActivityStreamID =  function(uuid, cb) {
        if (uuid === '1') {
          return cb(null, {_id: uuid});
        } else {
          return cb();
        }
      };
      communityCoreModule.permission = {
        canWrite: function(community, user, callback) {
          return callback(null, false);
        }
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
      var req = {
        user: {},
        body: {
          targets: [
            {
              objectType: 'activitystream',
              id: 1
            },
            {
              objectType: 'activitystream',
              id: 2
            },
            {
              objectType: 'activitystream',
              id: 3
            },
            {
              objectType: 'activitystream',
              id: 11
            },
            {
              objectType: 'activitystream',
              id: 12
            }
          ]
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(403);
          return done();
        }
      );
      middleware(req, res, done);
    });

    it('should be passthrough if inReplyTo is in the body', function(done) {
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
      var req = {
        body: {
          targets: undefined,
          inReplyTo: 'reply'
        }
      };
      var next = function() {
        done();
      };
      middleware(req, {}, next);
    });
  });

  describe('The findStreamResource fn', function() {
    it('should call next with error Communtity.getFromActivityStreamID send back error', function(done) {
      Community.getFromActivityStreamID = function(uuid, cb) {
        return cb(new Error());
      };
      let Domain = {};
      Domain.getFromActivityStreamID = function(uuid, cb) {
        return cb(null, null);
      };

      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).findStreamResource;
      var req = {
          params: {
            uuid: 1
        }
      };
      var res = this.helpers.express.jsonResponse(
        function() {
          done(new Error());
        }
      );
      var next = function(err) {
        expect(err).to.exist;
        done();
      };
      middleware(req, res, next);
    });

    it('should call next when stream resource is found (Community)', function(done) {
      Community.getFromActivityStreamID = function(uuid, cb) {
        return cb(null, {_id: 123});
      };
      let Domain = {};
      Domain.getFromActivityStreamID = function(uuid, cb) {
        return cb(null, null);
      };

      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).findStreamResource;
      var req = {
        params: {
          uuid: 1
       }
      };
      var res = this.helpers.express.jsonResponse(
        function() {
          done(new Error('Should not be called'));
        }
      );
      var next = function() {
        done();
      };
      middleware(req, res, next);
    });

    it('should call next if Community is not found', function(done) {
      Community.getFromActivityStreamID = function(uuid, cb) {
        return cb(null, null);
      };
      var middleware = require('../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).findStreamResource;
      var req = {
          params: {
            uuid: 1
        }
      };
      var res = {
        json: function() {
          done(new Error());
        }
      };
      var next = function(err) {
        expect(err).to.not.exist;
        done();
      };
      middleware(req, res, next);
    });
  });
});
