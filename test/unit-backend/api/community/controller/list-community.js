const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');

describe('The community controller #list function', function() {
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

  it('should send back 200 if community module sends back query result', function(done) {
    communityCoreModule.query = function(q, callback) {
      return callback(null, []);
    };

    var req = {
      query: {}
    };

    var res = this.helpers.express.jsonResponse(
      function(code, result) {
        expect(code).to.equal(200);
        expect(result).to.be.an.array;
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.list(req, res);
  });

  it('should send back 200 with communities and members_count', function(done) {
    var result = [
      {_id: 1, members: [1, 2]},
      {_id: 2, members: [1, 2, 3]}
    ];

    communityCoreModule.query = function(q, callback) {
      return callback(null, result);
    };
    communityCoreModule.member = {
      isMember: function(community, user, callback) {
        return callback(null, true);
      },
      getMembershipRequest: function() {
        return false;
      }
    };
    communityCoreModule.permission = {
      canFind: function(community, tuple, callback) {
        return callback(null, true);
      }
    };

    var req = {
      query: {},
      user: {_id: 1}
    };

    var res = this.helpers.express.jsonResponse(
      function(code, result) {
        expect(code).to.equal(200);
        expect(result).to.be.an.array;
        result.forEach(function(community) {
          expect(community.members).to.not.exist;
          expect(community.members_count).to.be.an.integer;
        });
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.list(req, res);
  });

  it('should send back 200 with communities and members types counter', function(done) {
    var result = [
      {_id: 1, members: [1, 2]},
      {_id: 2, members: [1, 2, 3]}
    ];

    communityCoreModule.query = function(q, callback) {
      return callback(null, result);
    };
    communityCoreModule.member = {
      isMember: function(community, user, callback) {
        return callback(null, true);
      },
      getMembershipRequest: function() {
        return false;
      }
    };
    communityCoreModule.permission = {
      canFind: function(community, tuple, callback) {
        return callback(null, true);
      }
    };

    var req = {
      query: {},
      user: {_id: 1}
    };

    var res = this.helpers.express.jsonResponse(
      function(code, result) {
        expect(code).to.equal(200);
        expect(result).to.be.an.array;
        result.forEach(function(community) {
          expect(community.members).to.not.exist;
          expect(community.members_count).to.be.an.integer;
          expect(community.members_requests_count).to.be.an.integer;
          expect(community.members_invitations_count).to.be.an.integer;
        });
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.list(req, res);
  });

  it('should call the community module with domain in query when defined in the request', function(done) {
    var req = {
      domain: {_id: 123},
      query: {}
    };

    communityCoreModule.query = function(q) {
      expect(q.domain_ids).to.exist;
      expect(q.domain_ids.length).to.equal(1);
      expect(q.domain_ids[0]).to.equal(req.domain._id);
      done();
    };

    var res = {};

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.list(req, res);
  });

  it('should call the community module with title in query when defined in the request', function(done) {
    var fakeTitle = 'fakeTitle';

    var req = {
      query: {
        title: fakeTitle
      }
    };

    communityCoreModule.query = function(q) {
      expect(q.title).to.exist;
      expect(q.title.toString()).to.equal('/^' + fakeTitle + '$/i');
      done();
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.list(req, {});
  });

  it('should call the community module with title in query and escape regexp characters in the query', function(done) {
    var req = {
      query: {
        title: 'fake$Title^'
      }
    };

    communityCoreModule.query = function(q) {
      expect(q.title).to.exist;
      expect(q.title.toString().indexOf('\\$') > -1).to.be.true;
      expect(q.title.toString().indexOf('\\^') > -1).to.be.true;
      done();
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.list(req, {});
  });

  it('should call the community module with creator in query when defined in the request', function(done) {
    var creatorId = '1234';
    var req = {
      query: {
        creator: creatorId
      }
    };

    communityCoreModule.query = function(q) {
      expect(q.creator).to.exist;
      expect(q.creator).to.equal(creatorId);
      done();
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.list(req, {});
  });
});
