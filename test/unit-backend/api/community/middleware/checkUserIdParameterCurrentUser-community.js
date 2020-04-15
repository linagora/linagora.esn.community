const { expect } = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');

describe('The community middleware #checkUserIdParameterIsCurrentUser function', function() {
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

    mockery.registerMock('../../../lib', () => communityCoreModule);
    this.moduleHelpers.addDep('collaboration', collaborationCoreModule);
    this.moduleHelpers.addDep('db', dbCoreModule);
    this.moduleHelpers.addDep('logger', loggerCoreModule);
    this.moduleHelpers.addDep('activitystreamMW', activitystreamMwCoreModule);

    this.helpers.mock.models({
      Community: {}
    });
  });

  it('should send back 400 when req.user is not defined', function(done) {
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserIdParameterIsCurrentUser;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserIdParameterIsCurrentUser;
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

    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserIdParameterIsCurrentUser;
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

    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).checkUserIdParameterIsCurrentUser;
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
