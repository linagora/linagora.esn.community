var expect = require('chai').expect;
var sinon = require('sinon');

describe('The community middleware #filterWritableTargets function', function() {
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
            model: function() {
              return Community;
          }
        }
      }
    };
    loggerCoreModule = {};
    activitystreamMwCoreModule = {
      addStreamResourceFinder: function() {},
      addStreamWritableFinder: function() {}
    };

    this.moduleHelpers.addDep('community', communityCoreModule);
    this.moduleHelpers.addDep('collaboration', collaborationCoreModule);
    this.moduleHelpers.addDep('db', dbCoreModule);
    this.moduleHelpers.addDep('logger', loggerCoreModule);
    this.moduleHelpers.addDep('activitystreamMW', activitystreamMwCoreModule);

    this.helpers.mock.models({
      Community: {}
    });
  });

  it('should call next if targets is not set', function(done) {
    Community.getFromActivityStreamID = function(uuid, cb) {
      return cb(new Error());
    };
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
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

    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
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

    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
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
      }

      return cb();
    };
    communityCoreModule.permission = {
      canWrite: function(community, user, callback) {
        return callback(null, true);
      }
    };

    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
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
    Community.getFromActivityStreamID = function(uuid, cb) {
      if (uuid === '1') {
        return cb(null, {_id: uuid});
      }

      return cb();
    };
    communityCoreModule.permission = {
      canWrite: function(community, user, callback) {
        return callback(null, false);
      }
    };
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).filterWritableTargets;
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
