const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');

describe('The community controller #getMine function', function() {
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

  it('should send back 400 is req.user is undefined', function(done) {
    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var req = {
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMine(req, res);
  });

  it('should send back 500 is community module sends back error', function(done) {
    communityCoreModule.getUserCommunities = function(q, r, callback) {
      return callback(new Error());
    };

    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(500);
        done();
      }
    );

    var req = {
      user: {_id: 123}
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMine(req, res);
  });

  it('should send back 200 with the communities', function(done) {
    var result = [{_id: 1}, {_id: 2}];

    communityCoreModule.getUserCommunities = function(q, r, callback) {
      return callback(null, result);
    };
    communityCoreModule.member = {
      isMember: function(c, u, callback) {
        return callback(null, true);
      },
      getMembershipRequest: function() {
        return false;
      }
    };
    communityCoreModule.getMembershipRequest = function() {
      return false;
    };

    var res = this.helpers.express.jsonResponse(
      function(code, json) {
        expect(code).to.equal(200, json);
        expect(json).to.deep.equal([
          {_id: 1, members_count: 0, members_invitations_count: 0, members_requests_count: 0, member_status: 'member'},
          {_id: 2, members_count: 0, members_invitations_count: 0, members_requests_count: 0, member_status: 'member'}
        ]);

        done();
      }
    );

    var req = {
      user: {_id: 123}
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMine(req, res);
  });

  it('should send back 200 with the communities(membershipRequest)', function(done) {
    var result = [{_id: 1}, {_id: 2}];

    communityCoreModule.getUserCommunities = function(q, r, callback) {
      return callback(null, result);
    };
    communityCoreModule.member = {
      isMember: function(c, u, callback) {
        return callback(null, true);
      },
      getMembershipRequest: function() {
        return { timestamp: { creation: new Date(1419509532000) } };
      }
    };

    var res = this.helpers.express.jsonResponse(
      function(code, json) {
        expect(code).to.equal(200, json);
        expect(json).to.be.an('array');
        expect(json).to.have.length(2);
        expect(json[0]).to.have.property('membershipRequest');
        expect(json[0].membershipRequest).to.be.a('number');
        expect(json[0].membershipRequest).to.equal(1419509532000);
        done();
      }
    );

    var req = {
      user: {_id: 123}
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMine(req, res);
  });

  it('should send the transformed community model', function(done) {
    var result = [{_id: 1, members: [{_id: 'user1'}, {_id: 'user2'}]}, {_id: 2, members: [{_id: 'user2'}]}];

    communityCoreModule.getUserCommunities = function(q, r, callback) {
      return callback(null, result);
    };
    communityCoreModule.member = {
      isMember: function(c, u, callback) {
        return callback(null, true);
      },
      getMembershipRequest: function() {
        return false;
      }
    };

    var res = this.helpers.express.jsonResponse(
      function(code, json) {
        expect(code).to.equal(200, json);
        expect(json[0].members_count).to.equal(2);
        expect(json[0].member_status).to.equal('member');
        expect(json[1].members_count).to.equal(1);
        expect(json[1].member_status).to.equal('member');
        done();
      }
    );

    var req = {
      user: {_id: 'user2'}
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.getMine(req, res);
  });
});
