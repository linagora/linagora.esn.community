var sinon = require('sinon');

describe('canRead() method', function() {
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
  it('should call next if the community type is "open"', function(done) {
    communityCoreModule.member = {
      isMember: function() {
        done(new Error('I should not be called'));
      }
    };
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canRead;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canRead;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canRead;
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
    var middleware = require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies).canRead;
    var req = {
      community: { type: 'confidential' },
      user: {_id: 'user1'}
    };
    var res = {};
    var err = function() { done(new Error('I should not be called')); };

    middleware(req, res, err);
  });
});
