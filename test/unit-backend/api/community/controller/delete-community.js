const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');

describe('The community controller #delete function', function() {
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

    it('should send back 500 if community module sends back error on query', function(done) {
      communityCoreModule.query = function(q, callback) {
        return callback(new Error());
      };

      var req = {
        query: {}
      };

      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );

      var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

      communities.list(req, res);
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

    communities.delete(req, res);
  });

  it('should return 500 if community#delete rejects error', function(done) {
    communityCoreModule.delete = sinon.stub().returns(Promise.reject(new Error()));
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
    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.delete(req, res);
  });

  it('should return 204 if community#delete resolves', function(done) {
    communityCoreModule.delete = sinon.stub().returns(Promise.resolve());
    var req = {
      community: {},
      user: {}
    };
    var res = this.helpers.express.response(
      function(code) {
        expect(code).to.equal(204);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.delete(req, res);
  });
});
