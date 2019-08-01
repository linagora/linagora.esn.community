const mockery = require('mockery');
const { expect } = require('chai');
const sinon = require('sinon');
const CONSTANTS = require('../../../../backend/lib/core/constants');

describe('The community module', function() {
  let getModule;
  let db, communityMock, domainMock, collaborationMock, pubsubMock, modelsMock;
  let localTopicMock, globalpubsubMock, forwardMock;

  beforeEach(function() {
    communityMock = function() {};

    modelsMock = {
      Community: communityMock
    };

    db = {
      mongo: {
        mongoose: {
          model: function(type) {
            return modelsMock[type];
          }
        }
      }
    };

    domainMock = {
      getDomainAdministrators: sinon.spy(function(user, domain, callback) {
        callback();
      })
    };

    collaborationMock = {
      registerCollaborationModel: function() {},
      registerCollaborationLib: function() {},
      memberResolver: {
        registerResolver: function() {}
      }
    };

    forwardMock = sinon.spy();
    globalpubsubMock = {
      topic() {}
    };
    localTopicMock = sinon.stub().returns({ forward: forwardMock });
    pubsubMock = {
      local: {
        topic: localTopicMock
      },
      global: globalpubsubMock
    };

    this.moduleHelpers.addDep('domain', domainMock);
    this.moduleHelpers.addDep('collaboration', collaborationMock);
    this.moduleHelpers.addDep('db', db);
    this.moduleHelpers.addDep('pubsub', pubsubMock);

    getModule = () => require(`${this.moduleHelpers.backendPath}/lib/core/index`)(this.moduleHelpers.dependencies);
  });

  describe('The update fn', function() {
    it('should update the document correctly and save it', function() {
      const modifications = {
        title: 'new title',
        avatar: 'new avatar',
        newMembers: [{ _id: 42 }],
        deleteMembers: [{ _id: 3 }]
      };

      const communityLib = getModule();

      const newCommunity = {};

      const community = {
        title: 'title',
        avatar: 'avatar',
        members: [{ member: { id: 3 } }],
        save: function(callback) {
          callback(null, newCommunity);
        }
      };

      const callbackSpy = sinon.spy();

      communityLib.update(community, modifications, callbackSpy);

      expect(callbackSpy).to.have.been.calledWith(null, sinon.match.same(newCommunity));
      expect(community).to.deep.equals({
        title: modifications.title,
        avatar: modifications.avatar,
        members: [{ member: { id: 42, objectType: 'user' } }],
        save: community.save
      });
    });

    it('should pubsub the modification if it succeed', function() {

      const modifications = {};
      let newCommunity;
      const community = {
        title: 'title',
        avatar: 'avatar',
        members: [{ member: { id: 3 } }],
        save: function(callback) {
          callback(null, newCommunity);
        }
      };

      const communityLib = getModule();

      communityLib.update(community, modifications, sinon.spy());
      expect(localTopicMock).to.have.been.calledWith(CONSTANTS.EVENTS.communityUpdate);
      expect(forwardMock).to.have.been.calledWith(sinon.match.same(globalpubsubMock), {
        modifications: sinon.match.same(modifications),
        community: sinon.match.same(newCommunity)
      });
    });
  });

  describe('The save fn', function() {
    it('should send back error if community is undefined', function(done) {
      this.moduleHelpers.addDep('db', db);
      this.moduleHelpers.addDep('pubsub', pubsubMock);
      const community = getModule();

      community.save(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if community.title is undefined', function(done) {
      this.moduleHelpers.addDep('db', db);
      this.moduleHelpers.addDep('pubsub', pubsubMock);
      const community = getModule();

      community.save({ domain_id: 123 }, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if community.domain_id is undefined', function(done) {
      this.moduleHelpers.addDep('db', db);
      this.moduleHelpers.addDep('pubsub', pubsubMock);
      const community = getModule();

      community.save({ title: 'title' }, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if Community.testTitleDomain sends back error', function(done) {
      this.moduleHelpers.addDep('db', db);
      this.moduleHelpers.addDep('pubsub', pubsubMock);
      const community = getModule();

      community.save({ domain_id: 123, title: 'title' }, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if Community.testTitleDomain sends back result', function(done) {
      this.moduleHelpers.addDep('db', db);
      this.moduleHelpers.addDep('pubsub', pubsubMock);
      const community = getModule();

      community.save({ domain_id: 123, title: 'title' }, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should publish a notification when save succeed', function(done) {
      const response = { _id: 1, foo: 'bar' };
      const spy = sinon.spy();

      communityMock.prototype.save = function(callback) {
        callback(null, response);
      };
      communityMock.testTitleDomain = function(title, ids, callback) {
        return callback();
      };

      const pubsubMock = {
        local: {
          topic: function(name) {
            if (name === CONSTANTS.EVENTS.communityCreated) {
              return {
                publish: spy
              };
            }
          }
        },
        global: {
          topic() {}
        }
      };

      this.moduleHelpers.addDep('db', db);
      this.moduleHelpers.addDep('pubsub', pubsubMock);

      const community = getModule();

      community.save({ domain_ids: [123], title: 'title' }, function(err, result) {
        expect(err).to.not.be.defined;
        expect(result).to.deep.equal(response);
        expect(spy).to.have.been.calledWith(response);
        done();
      });
    });
  });

  describe('The load fn', function() {
    it('should send back error if community is undefined', function(done) {
      const community = getModule();

      community.load(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call mongoose#findOne', function(done) {
      modelsMock.Community.findOne = function() {
        return done();
      };
      const community = getModule();

      community.load(123, function(err) {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  describe('The loadWithDomain fn', function() {
    it('should send back error if community is undefined', function(done) {
      const community = getModule();

      community.loadWithDomains(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call mongoose#findOne', function(done) {
      modelsMock.Community.findOne = function() {
        return {
          populate: function() {
            return {
              exec: function() {
                done();
              }
            };
          }
        };
      };

      const community = getModule();

      community.loadWithDomains(123, function(err) {
        expect(err).to.not.exist;
      });
    });
  });

  describe('The query fn', function() {
    it('should call collaboration.query with the "community" objectType', function(done) {
      collaborationMock.query = function(objectType) {
        expect(objectType).to.equal('community');
        done();
      };
      const community = getModule();

      community.query(null, function() {});
    });
  });

  describe('The delete fn', function() {
    it('should reject when community is undefined', function(done) {
      const community = getModule();

      community.delete(null, {}).then(() => done(new Error('Should not occur'))).catch(() => done());
    });

    it('should send back error if user is undefined', function(done) {
      const community = getModule();

      community.delete({}).then(() => done(new Error('Should not occur'))).catch(() => done());
    });

    it('should reject when archive call rejects', function(done) {
      const error = new Error('I can not archive community');
      const community = { _id: 1 };
      const user = { _id: 2 };
      const processSpy = sinon.stub().returns(Promise.reject(error));
      const archive = () => ({ process: processSpy });

      mockery.registerMock('./archive', archive);
      const communityModule = getModule();

      communityModule.delete(community, user)
        .then(() => done(new Error('Should not occur')))
        .catch(err => {
          expect(processSpy).to.have.been.calledWith(community, user);
          expect(err).to.equal(error);
          done();
        });
      });

    it('should resolve when archive call resolves', function(done) {
      const community = { _id: 1 };
      const user = { _id: 2 };
      const processSpy = sinon.stub().returns(Promise.resolve());
      const archive = () => ({ process: processSpy });

      mockery.registerMock('./archive', archive);
      const communityModule = getModule();

      communityModule.delete(community, user).then(() => {
        expect(processSpy).to.have.been.calledWith(community, user);
        done();
      }).catch(done);
    });
  });

  describe('The updateAvatar fn', function() {
    it('should send back error when community is undefined', function(done) {
      const community = getModule();

      community.updateAvatar(null, 1, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when avatar id is undefined', function(done) {
      const community = getModule();

      community.updateAvatar({}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('The isManager fn', function() {
    let communityPopulateMock;

    beforeEach(function() {
      communityPopulateMock = sinon.spy();
      domainMock.getDomainAdministrators = function(domain) {
        return domain.administrators;
      };
    });

    it('should send back error when Community.findById fails', function(done) {
      modelsMock.Community.findById = () => ({
        populate: communityPopulateMock,
        exec: callback => callback(new Error())
      });

      const community = getModule();

      community.member.isManager(123, 456, err => {
        expect(err).to.exist;
        expect(communityPopulateMock).to.have.been.calledWith('domain_ids');
        done();
      });
    });

    it('should send back true when user is creator', function(done) {
      const creator = { _id: 'creator' };
      const populatedCommunity = {
        creator: creator._id,
        domain_ids: []
      };

      modelsMock.Community.findById = () => ({
        populate: communityPopulateMock,
        exec: callback => callback(null, populatedCommunity)
      });

      const community = getModule();

      community.member.isManager(123, { _id: creator._id }, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        expect(communityPopulateMock).to.have.been.calledWith('domain_ids');
        done();
      });
    });

    it('should send back true when user is domain administrator', function(done) {
      const creator = { _id: 'creator' };
      const admin = { _id: 'admin' };

      const populatedCommunity = {
        creator: creator._id,
        domain_ids: [{
          administrators: [{
            user_id: admin._id
          }]
        }]
      };

      modelsMock.Community.findById = () => ({
        populate: communityPopulateMock,
        exec: callback => callback(null, populatedCommunity)
      });

      const community = getModule();

      community.member.isManager(123, { _id: admin._id }, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        expect(communityPopulateMock).to.have.been.calledWith('domain_ids');
        done();
      });
    });

    it('should send back false when user is domain user', function(done) {
      const creator = { _id: 'creator' };
      const admin = { _id: 'admin' };
      const user = { _id: 'user' };

      const populatedCommunity = {
        creator: creator._id,
        domain_ids: [{
          administrators: [{
            user_id: admin._id
          }]
        }]
      };

      modelsMock.Community.findById = () => ({
        populate: communityPopulateMock,
        exec: callback => callback(null, populatedCommunity)
      });

      const community = getModule();

      community.member.isManager(123, { _id: user._id }, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(communityPopulateMock).to.have.been.calledWith('domain_ids');
        done();
      });
    });
  });

  describe('The isMember fn', function() {
    beforeEach(function() {
      collaborationMock.member = {
        isMember: {}
      };
    });

    it('should send back true when user is part of the community', function(done) {
      const id = 456;

      collaborationMock.member.isMember = function(comMock, tuple, callback) {
        const err = null;
        const result = true;

        callback(err, result);
      };

      const community = getModule();
      const comMock = {
        _id: 'community1',
        members: [
        {
          member: {
            objectType: 'user',
            id: 123
          }
        },
        {
            member: {
              objectType: 'user',
              id: id
            }
          }
        ]
      };

      community.member.isMember(comMock, { objectType: 'user', id: id }, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;

        return done();
      });
    });

    it('should send back false when user is not part of the community', function(done) {
      collaborationMock.member.isMember = function(comMock, tuple, callback) {
        const err = null;
        const result = false;

        callback(err, result);
      };

      const community = getModule();
      const comMock = {
        _id: 'community1',
        members: [
        {
          member: {
            objectType: 'user',
            id: 123
          }
        },
        {
          member: {
            objectType: 'user',
            id: 234
          }
        }
        ]
      };

      community.member.isMember(comMock, { objectType: 'user', id: 456 }, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;

        return done();
      });
    });

    it('should send back false when tuple is invalid', function(done) {
      collaborationMock.member.isMember = function(comMock, tuple, callback) {
        const err = null;
        const result = false;

        callback(err, result);
      };

      const community = getModule();
      const comMock = {
        _id: 'community1',
        members: [
        {
          member: {
            id: 123
          }
        }
        ]
      };

      community.member.isMember(comMock, { objectType: 'user', id: 456 }, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;

        return done();
      });
    });

    it('should send back false when tuple is not a user', function(done) {
      collaborationMock.member.isMember = function(comMock, tuple, callback) {
        const err = null;
        const result = false;

        callback(err, result);
      };

      const community = getModule();
      const comMock = {
        _id: 'community1',
        members: [
        {
          member: {
            objectType: 'unicorn',
            id: 123
          }
        }
        ]
      };

      community.member.isMember(comMock, { objectType: 'user', id: 456 }, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;

        return done();
      });
    });

  });

  describe('The getMembers fn', function() {
    it('should send back error when Community.findById fails', function(done) {
      modelsMock.Community.findById = function(id, callback) {
        return callback(new Error());
      };

      const community = getModule();

      community.member.getMembers({ _id: 123 }, null, function(err) {
        expect(err).to.exist;

        return done();
      });
    });

    it('should send back [] when Community.exec does not find members', function(done) {
      modelsMock.Community.findById = function(id, callback) {
        return callback(null, { members: [] });
      };

      modelsMock.User = {
        find: function(query, callback) {
          return callback(null, []);
        }
      };

      const community = getModule();

      community.member.getMembers({ _id: 123 }, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.an.array;
        expect(result.length).to.equal(0);

        return done();
      });
    });

    it('should send back result members', function(done) {
      const result = [{ member: { _id: 'id1', firstname: 'user1' } }, { member: { _id: 'id2', firstname: 'user2' } }];

      modelsMock.Community.findById = function(id, callback) {
        return callback(null, { members: [
          { member: { id: 'id1', objectType: 'user' } },
          { member: { id: 'id2', objectType: 'user' } }
          ] });
      };

      modelsMock.User = {
        find: function(query, callback) {
          expect(query._id.$in).to.be.an('array');
          expect(query._id.$in).to.have.length(2);
          expect(query._id.$in).to.contain('id1');
          expect(query._id.$in).to.contain('id2');

          return callback(null, [
            { _id: 'id1', firstname: 'user1' },
            { _id: 'id2', firstname: 'user2' }
          ]);
        }
      };

      const community = getModule();

      community.member.getMembers({ _id: 123 }, {}, function(err, members) {
        expect(err).to.not.exist;
        expect(members).to.be.an.array;
        expect(members).to.deep.equal(result);

        return done();
      });
    });

    it('should slice members when query is defined', function(done) {
      const query = {
        limit: 2,
        offset: 3
      };

      modelsMock.Community.findById = function(id, callback) {
        return callback(null, { members: [
        { member: { id: 'id1', objectType: 'user' } },
        { member: { id: 'id2', objectType: 'user' } },
        { member: { id: 'id3', objectType: 'user' } },
        { member: { id: 'id4', objectType: 'user' } },
        { member: { id: 'id5', objectType: 'user' } },
        { member: { id: 'id6', objectType: 'user' } }
        ] });
      };
      modelsMock.User = {
        find: function(query) {
          expect(query._id.$in).to.be.an('array');
          expect(query._id.$in).to.have.length(2);
          expect(query._id.$in).to.contain('id4');
          expect(query._id.$in).to.contain('id5');

          return done();
        }
      };

      const community = getModule();

      community.member.getMembers({ _id: 123 }, query, function() {
      });
    });

    it('should slice members even if query is not defined', function(done) {
      modelsMock.Community.findById = function(a, callback) {
        return callback(
          null,
          {
            members: {
              slice: function() {
                return {
                  splice: function(offset, limit) {
                    expect(offset).to.equal(0);
                    expect(limit).to.equal(50);
                    done();

                    return [];
                  }
                };
              }
            }
          }
        );
      };
      modelsMock.User = {
        find: function() {}
      };

      const community = getModule();

      community.member.getMembers({ _id: 123 }, {}, function() {
        done();
      });
    });
  });

  describe('The getManagers fn', function() {
    it('should send back error when Community.exec fails', function(done) {
      modelsMock.Community.findById = function() {
        return {
          slice: function() {},
          populate: function() {},
          exec: function(callback) {
            return callback(new Error());
          }
        };
      };

      const community = getModule();

      community.member.getManagers({ _id: 123 }, null, function(err) {
        expect(err).to.exist;

        return done();
      });
    });

    it('should send back [] if there is no community is found', function(done) {
      const communityPopulateMock = sinon.spy();

      modelsMock.Community.findById = function() {
        return {
          populate: communityPopulateMock,
          exec: callback => callback()
        };
      };

      const community = getModule();

      community.member.getManagers({ _id: 123 }, {}, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.an.array;
        expect(result.length).to.equal(0);
        expect(communityPopulateMock).to.have.been.calledWith('domain_ids');
        done();
      });
    });

    it('should send back the list of managers', function(done) {
      const user1 = { _id: 'user1' };
      const user2 = { _id: 'user2' };
      const user3 = { _id: 'user3' };
      const creator = { _id: 'creator' };

      const domains = [{
        administrators: [
          { user_id: user1._id },
          { user_id: user2._id }
        ]
      }, {
        administrators: [
          { user_id: user2._id },
          { user_id: user3._id }
        ]
      }];

      const userFindMock = sinon.spy((query, callback) => {
        expect(query).to.deep.equal({ _id: { $in: [creator._id, user1._id, user2._id, user3._id] } });
        callback(null, [creator, user1, user2, user3]);
      });

      const communityPopulateMock = sinon.spy();
      const populatedCommunity = {
        creator: creator._id,
        domain_ids: domains
      };

      modelsMock.Community.findById = function() {
        return {
          populate: communityPopulateMock,
          exec: callback => callback(null, populatedCommunity)
        };
      };
      modelsMock.User = {
        find: userFindMock
      };

      domainMock.getDomainAdministrators = function(domain) {
        return domain.administrators;
      };

      const community = getModule();

      community.member.getManagers({ _id: 123 }, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.an.array;
        expect(result).to.deep.equal([creator, user1, user2, user3]);
        expect(communityPopulateMock).to.have.been.calledWith('domain_ids');
        expect(userFindMock).to.have.been.calledOnce;
        done();
      });
    });
  });

  describe('The getUserCommunities fn', function() {
    it('should send back error when user is null', function(done) {
      const community = getModule();

      community.getUserCommunities(null, function(err) {
        expect(err).to.exist;

        return done();
      });
    });
  });

  describe('userToMember fn', function() {
    it('should send back result even if user is null', function(done) {
      const community = getModule();

      const member = community.userToMember(null);

      expect(member).to.exist;
      done();
    });

    it('should send back result even if document.user is null', function(done) {
      const community = getModule();
      const member = community.userToMember({});

      expect(member).to.exist;
      done();
    });

    it('should filter document', function(done) {
      const user = {
        _id: 1,
        firstname: 'Me',
        password: '1234',
        avatars: [1, 2, 3],
        login: [4, 5, 6]
      };

      const community = getModule();
      const member = community.userToMember({ member: user });

      expect(member).to.exist;
      expect(member.user).to.exist;
      expect(member.user._id).to.exist;
      expect(member.user.firstname).to.exist;
      expect(member.user.password).to.not.exist;
      expect(member.user.avatars).to.not.exist;
      expect(member.user.login).to.not.exist;
      done();
    });

  });

  describe('getMembershipRequest() method', function() {
    it('should support communities that have no membershipRequests array property', function() {
      const getMembershipRequest = function(community, user) {
        return false;
      };

      collaborationMock.member = {
        getMembershipRequest: getMembershipRequest
      };

      const user = { _id: 'user1' };
      const community = { _id: 'community1' };
      const communityModule = getModule();
      const mr = communityModule.member.getMembershipRequest(community, user);

      expect(mr).to.be.false;
    });
    it('should return nothing if user does not have a membership request', function() {
      const user = { _id: 'user1' };
      const community = { _id: 'community1', membershipRequests: [{
        user: { equals: function() { return false; } },
        timestamp: { creation: new Date() }
      }] };
      const getMembershipRequest = function(community, user) {
        return false;
      };

      collaborationMock.member = {
        getMembershipRequest: getMembershipRequest
      };

      const communityModule = getModule();
      const mr = communityModule.member.getMembershipRequest(community, user);

      expect(mr).to.be.not.ok;
    });
    it('should return the membership object if user have a membership request', function() {
      const user = { _id: 'user1' };
      const community = { _id: 'community1', membershipRequests: [{
        user: { equals: function() { return true; } },
        timestamp: { creation: new Date(1419509532000) }
      }] };
      const getMembershipRequest = function(community, user) {
        return community.membershipRequests[0];
      };

      collaborationMock.member = {
        getMembershipRequest: getMembershipRequest
      };

      const communityModule = getModule();
      const mr = communityModule.member.getMembershipRequest(community, user);

      expect(mr).to.be.ok;
      expect(mr.timestamp).to.have.property('creation');
      expect(mr.timestamp.creation).to.be.a('Date');
      expect(mr.timestamp.creation.getTime()).to.equal(1419509532000);
    });
  });

  describe('The getMembershipRequests fn', function() {
    it('should send back error when Community.exec fails', function(done) {
      modelsMock.Community.findById = function() {
        return {
          slice: function() {},
          populate: function() {},
          exec: function(callback) {
            return callback(new Error());
          }
        };
      };
      const getMembershipRequests = function(objectType, community, query, callback) {
        const err = true;

        callback(err);
      };

      collaborationMock.member = {
        getMembershipRequests: getMembershipRequests
      };

      const community = getModule();

      community.member.getMembershipRequests({ _id: 123 }, {}, function(err) {
        expect(err).to.exist;

        return done();
      });
    });

    it('should send back [] when Community.exec does not find requests', function(done) {
      modelsMock.Community.findById = function() {
        return {
          slice: function() {},
          populate: function() {},
          exec: function(callback) {
            return callback();
          }
        };
      };

      const getMembershipRequests = function(objectType, community, query, callback) {
        const err = null;
        const result = [];

        callback(err, result);
      };

      collaborationMock.member = {
        getMembershipRequests: getMembershipRequests
      };

      const community = getModule();

      community.member.getMembershipRequests({ _id: 123 }, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.an.array;
        expect(result.length).to.equal(0);

        return done();
      });
    });

    it('should send back result requests', function(done) {
      const result = [{ user: 1 }, { user: 2 }];

      modelsMock.Community.findById = function() {
        return {
          slice: function() {},
          populate: function() {},
          exec: function(callback) {
            return callback(null, { membershipRequests: result });
          }
        };
      };
      const getMembershipRequests = function(objectType, community, query, callback) {
        const err = null;
        const requests = result;

        callback(err, requests);
      };

      collaborationMock.member = {
        getMembershipRequests: getMembershipRequests
      };

      const community = getModule();

      community.member.getMembershipRequests({ _id: 123 }, {}, function(err, requests) {
        expect(err).to.not.exist;
        expect(requests).to.be.an.array;
        expect(requests).to.deep.equal(result);

        return done();
      });
    });

    it('should slice members when query is defined', function(done) {
      const query = {
        limit: 2,
        offset: 10
      };

      modelsMock.Community.findById = function() {
        return {
          populate: function() {},
          slice: function(field, array) {
            expect(field).to.equal('membershipRequests');
            expect(array).to.exist;
            expect(array[0]).to.equal(query.offset);
            expect(array[1]).to.equal(query.limit);
          },
          exec: function(callback) {
            return callback(null, { members: [] });
          }
        };
      };
      const getMembershipRequests = function(objectType, community, query, callback) {
        const err = true;

        callback(err);
      };

      collaborationMock.member = {
        getMembershipRequests: getMembershipRequests
      };

      const community = getModule();

      community.member.getMembershipRequests({ _id: 123 }, query, function() {
        done();
      });
    });

    it('should slice members even if query is not defined', function(done) {
      modelsMock.Community.findById = function() {
        return {
          slice: function(field, array) {
            expect(field).to.equal('membershipRequests');
            expect(array).to.exist;
            expect(array[0]).to.exist;
            expect(array[1]).to.exist;
          },
          populate: function() {},
          exec: function(callback) {
            return callback(null, { members: [] });
          }
        };
      };

      const getMembershipRequests = function(objectType, community, query, callback) {
        const err = true;

        callback(err);
      };

      collaborationMock.member = {
        getMembershipRequests: getMembershipRequests
      };

      const community = getModule();

      community.member.getMembershipRequests({ _id: 123 }, {}, function() {
        done();
      });
    });
  });

  describe('The cleanMembershipRequest fn', function() {

    beforeEach(function() {
      const cleanMembershipRequest = function(collaboration, user, callback) {
        const err = true;
        const c = null;

        callback(err, c);
      };

      collaborationMock.member = {
        cleanMembershipRequest: cleanMembershipRequest
      };
    });

    it('should send back error when user is not defined', function() {
      const communityModule = getModule();

      communityModule.member.cleanMembershipRequest({}, null, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });

    it('should send back error when community is not defined', function() {
      const communityModule = getModule();

      communityModule.member.cleanMembershipRequest(null, {}, function(err, c) {
        expect(err).to.exist;
        expect(c).to.not.exist;
      });
    });
  });
});
