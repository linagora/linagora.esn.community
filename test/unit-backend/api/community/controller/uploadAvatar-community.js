var expect = require('chai').expect;
var sinon = require('sinon');

describe('The community controller #uploadAvatar function', function() {
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

  it('should return 404 if community is not defined in request', function(done) {
    var req = {
    };

    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(404);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.uploadAvatar(req, res);
  });

  it('should return 400 if request does not have mimetype', function(done) {
    var req = {
      community: {},
      query: {
        size: 1
      }
    };
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.uploadAvatar(req, res);
  });

  it('should return 400 if request does not have size', function(done) {
    var req = {
      community: {},
      query: {
        mimetype: 'image/png'
      }
    };
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.uploadAvatar(req, res);
  });

  it('should return 400 if request does not have a valid mimetype', function(done) {
    var req = {
      community: {},
      query: {
        size: 1,
        mimetype: 'badimagetype'
      }
    };
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.uploadAvatar(req, res);
  });

  it('should return 400 if request does not have a valid size', function(done) {
    var req = {
      community: {},
      query: {
        size: 'a',
        mimetype: 'image/png'
      }
    };
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.uploadAvatar(req, res);
  });

  it('should return 500 if image module sends back error', function(done) {
    imageCoreModule.recordAvatar = function(id, mime, options, req, callback) {
      return callback(new Error());
    };

    var req = {
      community: {},
      query: {
        size: 1,
        mimetype: 'image/png'
      }
    };
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(500);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.uploadAvatar(req, res);
  });

  it('should return 412 if image module sends back wrong size', function(done) {
    imageCoreModule.recordAvatar = function(id, mime, options, req, callback) {
      return callback(null, 2);
    };
    var req = {
      community: {},
      query: {
        size: 1,
        mimetype: 'image/png'
      }
    };
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(412);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.uploadAvatar(req, res);
  });

  it('should return 500 if avatar update fails on community module', function(done) {
    imageCoreModule.recordAvatar = function(id, mime, options, req, callback) {
      return callback(null, 1);
    };
    communityCoreModule.updateAvatar = function(community, uuid, callback) {
      return callback(new Error());
    };

    var req = {
      community: {},
      query: {
        size: 1,
        mimetype: 'image/png'
      }
    };
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(500);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.uploadAvatar(req, res);
  });

  it('should return 200 if avatar update succeeds on community module', function(done) {
    imageCoreModule.recordAvatar = function(id, mime, options, req, callback) {
      return callback(null, 1);
    };
    communityCoreModule.updateAvatar = function(community, uuid, callback) {
      return callback();
    };

    var req = {
      community: {},
      query: {
        size: 1,
        mimetype: 'image/png'
      }
    };
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(200);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.uploadAvatar(req, res);
  });

  it('should set the current user as avatar creator', function(done) {
    var user = {
      _id: 123
    };

    imageCoreModule.recordAvatar = function(id, mime, options) {
      expect(options).to.exist;
      expect(options.creator).to.exist;
      expect(options.creator.objectType).to.equal('user');
      expect(options.creator.id).to.equal(user._id);

      return done();
    };

    var req = {
      community: {},
      query: {
        size: 1,
        mimetype: 'image/png'
      },
      user: user
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.uploadAvatar(req, {});
  });
});
