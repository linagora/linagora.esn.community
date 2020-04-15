const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');

describe('The community controller #getAvatar function', function() {
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

    mockery.registerMock('../../../lib', () => communityCoreModule);
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

    communities.getAvatar(req, res);
  });

  it('should redirect if community.image is not defined in request', function(done) {
    var req = {
      community: {
      }
    };

    var res = {
      redirect: function() {
        done();
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getAvatar(req, res);
  });

  it('should redirect if image module fails', function(done) {
    imageCoreModule.getAvatar = function(id, format, callback) {
      return callback(new Error());
    };
    var req = {
      community: {
        avatar: 123
      },
      query: {
      }
    };
    var res = {
      json: function() {
        return done(new Error());
      },
      redirect: function() {
        return done();
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getAvatar(req, res);
  });

  it('should redirect if image module can not return image stream', function(done) {
    imageCoreModule.getAvatar = function(id, format, callback) {
      return callback();
    };

    var req = {
      community: {
        avatar: 123
      },
      query: {
      }
    };

    var res = {
      json: function() {
        return done(new Error());
      },
      redirect: function() {
        return done();
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getAvatar(req, res);
  });

  it('should return 304 if image has not changed', function(done) {
    var image = {
      stream: 'test',
      pipe: function() {
        throw new Error();
      }
    };
    var meta = {
      meta: 'data',
      uploadDate: new Date('Thu Apr 17 2014 11:13:15 GMT+0200 (CEST)')
    };

    imageCoreModule.getAvatar = function(id, format, callback) {
      return callback(null, meta, image);
    };
    var req = {
      community: {
        avatar: 123
      },
      headers: {
        'if-modified-since': 'Thu Apr 17 2014 11:13:15 GMT+0200 (CEST)'
      },
      query: {
      }
    };
    var res = this.helpers.express.response(
      function(code) {
        expect(code).to.equal(304);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getAvatar(req, res);
  });

  it('should return 200, add to the cache, and the stream of the avatar file if all is ok', function(done) {
    var image = {
      stream: 'test',
      pipe: function(res) {
        expect(res.header['Last-Modified']).to.exist;
        expect(res.code).to.equal(200);
        done();
      }
    };

    imageCoreModule.getAvatar = function(defaultAvatar, format, callback) {
      return callback(null,
        {
          meta: 'data',
          uploadDate: new Date('Thu Apr 17 2014 11:13:15 GMT+0200 (CEST)')
        }, image);
    };

    var req = {
      headers: {
        'if-modified-since': 'Thu Apr 17 2013 11:13:15 GMT+0200 (CEST)'
      },
      community: {
        avatar: 123
      },
      query: {
      }
    };
    var res = {
      status: function(code) {
        this.code = code;
      },
      header: function(header, value) {
        this.header[header] = value;
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getAvatar(req, res);
  });
});
