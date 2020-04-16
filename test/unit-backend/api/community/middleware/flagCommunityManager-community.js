const { expect } = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');

describe('The community middleware #flagCommunityManager method', function() {
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
    this.moduleHelpers.addDep('community', communityCoreModule);
    this.moduleHelpers.addDep('collaboration', collaborationCoreModule);
    this.moduleHelpers.addDep('db', dbCoreModule);
    this.moduleHelpers.addDep('logger', loggerCoreModule);
    this.moduleHelpers.addDep('activitystreamMW', activitystreamMwCoreModule);

    this.helpers.mock.models({
      Community: {}
    });
  });
  it('should send back 400 when req.community is not defined', function(done) {
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).flagCommunityManager;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).flagCommunityManager;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).flagCommunityManager;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).flagCommunityManager;
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
