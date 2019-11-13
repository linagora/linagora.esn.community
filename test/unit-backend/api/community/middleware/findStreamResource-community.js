var expect = require('chai').expect;
var sinon = require('sinon');

describe('The findStreamResource fn', function() {
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
  it('should call next with error Communtity.getFromActivityStreamID send back error', function(done) {
    Community.getFromActivityStreamID = function(uuid, cb) {
      return cb(new Error());
    };
    const Domain = {};

    Domain.getFromActivityStreamID = function(uuid, cb) {
      return cb(null, null);
    };

    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).findStreamResource;
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
    const Domain = {};

    Domain.getFromActivityStreamID = function(uuid, cb) {
      return cb(null, null);
    };

    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).findStreamResource;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).findStreamResource;
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
