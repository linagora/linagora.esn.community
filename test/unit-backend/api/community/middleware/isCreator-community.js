var expect = require('chai').expect;
var sinon = require('sinon');

describe('the isCreator fn', function() {
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

  it('should send back 400 when req.community is not defined', function(done) {
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).isCreator;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).isCreator;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).isCreator;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).isCreator;
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
