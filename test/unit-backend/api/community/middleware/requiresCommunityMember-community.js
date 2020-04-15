const { expect } = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');

describe('The community middleware #requiresCommunityMember function', function() {
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

  it('should send back 400 when req.community is not defined', function(done) {
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).requiresCommunityMember;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).requiresCommunityMember;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).requiresCommunityMember;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).requiresCommunityMember;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).requiresCommunityMember;
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
