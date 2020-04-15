const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');

describe('The community controller #getMembers function', function() {
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

  it('should send back 400 is req.community is undefined', function(done) {
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var req = {
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMembers(req, res);
  });

  it('should send back 500 is community.getMembers returns error', function(done) {
    communityCoreModule.member = {
      getMembers: function(com, query, callback) {
        return callback(new Error());
      }
    };

    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(500);
        done();
      }
    );

    var req = {
      community: {},
      query: {}
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMembers(req, res);
  });

  it('should send back 200 is community.getMembers returns result', function(done) {
    communityCoreModule.member = {
      getMembers: function(com, query, callback) {
        return callback(null, []);
      }
    };

    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(200);
        done();
      }
    );

    var req = {
      community: {},
      query: {}
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMembers(req, res);
  });

  it('should set the header with the members size', function(done) {
    var members = [1, 2, 3];

    communityCoreModule.member = {
      getMembers: function(com, query, callback) {
        return callback(null, []);
      }
    };

    var res = this.helpers.express.jsonResponse(
      function(code, data, headers) {
        expect(code).to.equal(200);
        expect(headers).to.deep.equal({
          'X-ESN-Items-Count': members.length
        });

        done();
      }
    );

    var req = {
      community: {
        members: members
      },
      query: {}
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMembers(req, res);
  });

  it('should query user with request query parameters', function(done) {
    var members = [1, 2, 3];
    var limit = 23;
    var offset = 45;

    communityCoreModule.member = {
      getMembers: function(com, query, callback) {
        expect(query).to.exist;
        expect(query.limit).to.equal(limit);
        expect(query.offset).to.equal(offset);

        return callback(null, []);
      }
    };

    var res = this.helpers.express.jsonResponse(
      function(code, data, headers) {
        expect(code).to.equal(200);
        expect(headers).to.deep.equal({
          'X-ESN-Items-Count': members.length
        });

        done();
      }
    );

    var req = {
      community: {
        members: members
      },
      query: {
        offset: offset,
        limit: limit
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMembers(req, res);
  });
});
