var expect = require('chai').expect;
var sinon = require('sinon');

describe('The create fn', function() {
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

  it('should send back 400 if community title is not defined', function(done) {
    var req = {
      body: {},
      user: {_id: 123}
    };

    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.create(req, res);
  });

  it('should send back 400 if request does not contains domain', function(done) {
    var req = {
      body: {
        title: 'YOLO'
      },
      user: {_id: 123}
    };

    var res = this.helpers.express.jsonResponse(
      function(code) {
        expect(code).to.equal(400);
        done();
      }
    );

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.create(req, res);
  });

  it('should send back 500 if community module sends back error on save', function(done) {
    communityCoreModule.save = function(community, callback) {
      return callback(new Error());
    };

    var req = {
      body: {
        title: 'Node.js',
        domain_ids: ['123']
      },
      user: {_id: 123},
      domain: {},
      query: {}
    };

    var res = {
      status: function(code) {
        expect(Community.testTitleDomain).to.have.been.called;
        expect(code).to.equal(500);

        return this;
      },
      json: function() {
        done();
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.create(req, res);
  });

  it('should send back 201 if community module does not send back error on save', function(done) {
    var saved = {_id: 123};

    communityCoreModule.save = function(community, callback) {
      return callback(null, saved);
    };
    communityCoreModule.member = {
      isMember: function(community, user, callback) {
        return callback(null, true);
      },
      getMembershipRequest: function() {
        return false;
      }
    };

    var req = {
      body: {
        title: 'Node.js',
        domain_ids: [123]
      },
      user: {
        _id: 123
      },
      domain: {},
      query: {}
    };

    var res = {
      status: function(code) {
        expect(Community.testTitleDomain).to.have.been.called;
        expect(code).to.equal(201);

        return this;
      },
      json: function(data) {
        expect(data).to.deep.equal(saved);
        done();
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.create(req, res);
  });

  it('should not test the title if the noTitleCheck parameter is true', function(done) {
    var saved = {_id: 123};

    communityCoreModule.save = function(community, callback) {
      return callback(null, saved);
    };
    communityCoreModule.member = {
      isMember: function(community, user, callback) {
        return callback(null, true);
      },
      getMembershipRequest: function() {
        return false;
      }
    };

    var req = {
      body: {
        title: 'Node.js',
        domain_ids: [123]
      },
      user: {
        _id: 123
      },
      domain: {},
      query: {
        noTitleCheck: true
      }
    };

    var res = {
      status: function(code) {
        expect(Community.testTitleDomain).to.not.have.been.called;
        expect(code).to.equal(201);

        return this;
      },
      json: function(data) {
        expect(data).to.deep.equal(saved);
        done();
      }
    };

    var communities = require('../../../../../backend/webserver/api/community/controller')(this.moduleHelpers.dependencies);

    communities.create(req, res);
  });
});
