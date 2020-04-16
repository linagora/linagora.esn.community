const { expect } = require('chai');
const mockery = require('mockery');

describe('The community middleware', function() {
  let getModule, CommunityModelMock;
  let filterWritableTargets, findStreamResource;

  beforeEach(function() {
    CommunityModelMock = {};
    this.moduleHelpers.addDep('db', {
      mongo: {
        mongoose: {
          model: () => CommunityModelMock
        }
      }
    });

    this.moduleHelpers.addDep('collaboration', {});
    this.moduleHelpers.addDep('activitystreamMW', {
      addStreamResourceFinder: _findStreamResource => {
        findStreamResource = _findStreamResource;
      },
      addStreamWritableFinder: _filterWritableTargets => {
        filterWritableTargets = _filterWritableTargets;
      }
    });

    mockery.registerMock('../../../lib', () => ({}));
    getModule = () => require('../../../../../backend/webserver/api/community/middleware')(this.moduleHelpers.dependencies);
  });

  describe('The filterWritableTargets fn', function() {
    it('should call next if targets is not set', function(done) {
      CommunityModelMock = {
        getFromActivityStreamID: function(uuid, callback) {
          return callback(new Error());
        }
      };

      const req = {
        body: {
        }
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      getModule();

      filterWritableTargets(req, res, done);
    });

    it('should send back 400 if targets is empty', function(done) {
      CommunityModelMock = {
        getFromActivityStreamID: function(uuid, callback) {
          return callback(new Error());
        }
      };

      const req = {
        body: {
          targets: []
        }
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      getModule();
      filterWritableTargets(req, res, done);
    });

    it('should send back 400 if targets is undefined', function(done) {
      CommunityModelMock = {
        getFromActivityStreamID: function(uuid, callback) {
          return callback(new Error());
        }
      };

      const req = {
        body: {
          targets: undefined
        }
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(400);
          done();
        }
      );

      getModule();
      filterWritableTargets(req, res, done);
    });

    it('should not filter valid and writable targets', function(done) {
      CommunityModelMock = {
        getFromActivityStreamID: function(uuid, callback) {
          return callback(null, { _id: uuid });
        }
      };

      mockery.registerMock('../../../lib', () => ({
        permission: {
          canWrite: function(community, user, callback) {
            return callback(null, true);
          }
        }
      }));

      const req = {
        user: {},
        body: {
          targets: [
            {
              objectType: 'activitystream',
              id: '1'
            },
            {
              objectType: 'activitystream',
              id: '2'
            }
          ]
        }
      };
      const res = this.helpers.express.jsonResponse(
        function() {
        }
      );
      const next = function() {
        expect(req.body.targets.length).to.equal(2);
        done();
      };

      getModule();
      filterWritableTargets(req, res, next);
    });

    it('should filter invalid targets and keep writable targets', function(done) {
      CommunityModelMock = {
        getFromActivityStreamID: function(uuid, callback) {
          if (uuid === '1') {
            return callback(null, {_id: uuid});
          }

          return callback();
        }
      };

      mockery.registerMock('../../../lib', () => ({
        permission: {
          canWrite: function(community, user, callback) {
            return callback(null, true);
          }
        }
      }));

      const req = {
        user: {},
        body: {
          targets: [
            {
              objectType: 'activitystream',
              id: '1'
            },
            {
              objectType: 'activitystream',
              id: '2'
            }
          ]
        }
      };
      const res = this.helpers.express.jsonResponse(
        function() {
        }
      );
      const next = function() {
        expect(req.message_targets).to.exist;
        expect(req.message_targets.length).to.equal(1);
        expect(req.message_targets[0].id).to.equal('1');
        done();
      };

      getModule();
      filterWritableTargets(req, res, next);
    });

    it('should filter unwritable targets', function(done) {
      CommunityModelMock = {
        getFromActivityStreamID: function(uuid, callback) {
          return callback(null, { _id: uuid });
        }
      };

      mockery.registerMock('../../../lib', () => ({
        permission: {
          canWrite: function(community, user, callback) {
            return callback(null, community._id > 10);
          }
        }
      }));

      const req = {
        user: {},
        body: {
          targets: [
            {
              objectType: 'activitystream',
              id: 1
            },
            {
              objectType: 'activitystream',
              id: 2
            },
            {
              objectType: 'activitystream',
              id: 3
            },
            {
              objectType: 'activitystream',
              id: 11
            },
            {
              objectType: 'activitystream',
              id: 12
            }
          ]
        }
      };
      const res = this.helpers.express.jsonResponse(
        function() {
          done(new Error());
        }
      );
      const next = function() {
        expect(req.message_targets).to.exist;
        expect(req.message_targets.length).to.equal(2);
        done();
      };

      getModule();
      filterWritableTargets(req, res, next);
    });

    it('should send back 403 if no valid streams are set', function(done) {
      CommunityModelMock = {
        getFromActivityStreamID: function(uuid, callback) {
          if (uuid === '1') {
            return callback(null, {_id: uuid});
          }

          return callback();
        }
      };

      mockery.registerMock('../../../lib', () => ({
        permission: {
          canWrite: function(community, user, callback) {
            return callback(null, false);
          }
        }
      }));
      const req = {
        user: {},
        body: {
          targets: [
            {
              objectType: 'activitystream',
              id: 1
            },
            {
              objectType: 'activitystream',
              id: 2
            },
            {
              objectType: 'activitystream',
              id: 3
            },
            {
              objectType: 'activitystream',
              id: 11
            },
            {
              objectType: 'activitystream',
              id: 12
            }
          ]
        }
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(403);

          return done();
        }
      );

      getModule();
      filterWritableTargets(req, res, done);
    });

    it('should be passthrough if inReplyTo is in the body', function(done) {
      CommunityModelMock = {};

      const req = {
        body: {
          targets: undefined,
          inReplyTo: 'reply'
        }
      };
      const next = function() {
        done();
      };

      getModule();
      filterWritableTargets(req, {}, next);
    });
  });

  describe('The findStreamResource fn', function() {
    it('should call next with error Communtity.getFromActivityStreamID send back error', function(done) {
      CommunityModelMock = {
        getFromActivityStreamID: function(uuid, cb) {
          return cb(new Error());
        }
      };

      const req = {
        params: {
          uuid: 1
        }
      };
      const res = this.helpers.express.jsonResponse(
        function() {
          done(new Error());
        }
      );
      const next = function(err) {
        expect(err).to.exist;
        done();
      };

      getModule();
      findStreamResource(req, res, next);
    });

    it('should call next when stream resource is found (Community)', function(done) {
      CommunityModelMock = {
        getFromActivityStreamID: function(uuid, cb) {
          return cb(null, { _id: 123 });
        }
      };

      const req = {
        params: {
          uuid: 1
        }
      };
      const res = this.helpers.express.jsonResponse(
        function() {
          done(new Error('Should not be called'));
        }
      );
      const next = function() {
        done();
      };

      getModule();
      findStreamResource(req, res, next);
    });

    it('should call next if Community is not found', function(done) {
      CommunityModelMock = {
        getFromActivityStreamID: function(uuid, cb) {
          return cb(null, null);
        }
      };

      const req = {
        params: {
          uuid: 1
        }
      };
      const res = {
        json: function() {
          done(new Error());
        }
      };
      const next = function(err) {
        expect(err).to.not.exist;
        done();
      };

      getModule();
      findStreamResource(req, res, next);
    });
  });
});
