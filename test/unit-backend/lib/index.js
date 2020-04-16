const mockery = require('mockery');
const { expect } = require('chai');
const sinon = require('sinon');
const CONSTANTS = require('../../../backend/lib/constants');

describe('The community module', function() {
  let getModule, CommunityModelMock, UserModelMock, pubsubMock, collaborationMock, domainModuleMock;

  beforeEach(function() {
    CommunityModelMock = function() {};
    UserModelMock = function() {};
    pubsubMock = {
      local: {
        topic: () => ({
          forward: () => {}
        })
      },
      global: {}
    };
    this.moduleHelpers.addDep('db', {
      mongo: {
        mongoose: {
            model: modelName => {
              if (modelName === 'Community') {
                return CommunityModelMock;
              }

              if (modelName === 'User') {
                return UserModelMock;
              }
            }
        }
      }
    });
    collaborationMock = {
      registerCollaborationModel: function() {},
      registerCollaborationLib: function() {},
      memberResolver: {
        registerResolver() {}
      }
    };
    domainModuleMock = {
      getDomainAdministrators: () => []
    };
    this.moduleHelpers.addDep('pubsub', pubsubMock);
    this.moduleHelpers.addDep('collaboration', collaborationMock);
    this.moduleHelpers.addDep('domain', domainModuleMock);
    mockery.registerMock('./permission', () => {});

    getModule = () => require('../../../backend/lib/index')(this.moduleHelpers.dependencies);
  });

  describe('The update method', function() {
    it('should update the document correctly and save it', function() {
      const modifications = {
        title: 'new title',
        avatar: 'new avatar',
        newMembers: [{_id: 42}],
        deleteMembers: [{_id: 3}]
      };

      const newCommunity = {};

      const community = {
        title: 'title',
        avatar: 'avatar',
        members: [{member: {id: 3}}],
        save: function(callback) {
          callback(null, newCommunity);
        }
      };

      const callbackSpy = sinon.spy();

      getModule().update(community, modifications, callbackSpy);

      expect(callbackSpy).to.have.been.calledWith(null, sinon.match.same(newCommunity));
      expect(community).to.deep.equals({
        title: modifications.title,
        avatar: modifications.avatar,
        members: [{member: {id: 42, objectType: 'user'}}],
        save: community.save
      });
    });

    it('should pubsub the modification if it succeed', function() {
      const forwardMock = sinon.spy();
      const globalpubsubMock = {
        topic() {}
      };
      const localTopicMock = sinon.stub().returns({ forward: forwardMock });

      pubsubMock.local.topic = localTopicMock;
      pubsubMock.global = globalpubsubMock;

      const modifications = {};
      const newCommunity = {};
      const community = {
        title: 'title',
        avatar: 'avatar',
        members: [{member: {id: 3}}],
        save: function(callback) {
          callback(null, newCommunity);
        }
      };

      getModule().update(community, modifications, sinon.spy());
      expect(localTopicMock).to.have.been.calledWith(CONSTANTS.EVENTS.communityUpdate);
      expect(forwardMock).to.have.been.calledWith(sinon.match.same(globalpubsubMock), {
        modifications: sinon.match.same(modifications),
        community: sinon.match.same(newCommunity)
      });
    });
  });

  describe('The save method', function() {
    it('should send back error if community is undefined', function(done) {
      getModule().save(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if community.title is undefined', function(done) {
      getModule().save({domain_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if community.domain_id is undefined', function(done) {
      getModule().save({title: 'title'}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if Community.testTitleDomain sends back error', function(done) {
      getModule().save({domain_id: 123, title: 'title'}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if Community.testTitleDomain sends back result', function(done) {
      getModule().save({domain_id: 123, title: 'title'}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should publish a notification when save succeed', function(done) {
      const response = {_id: 1, foo: 'bar'};
      const spy = sinon.spy();

      CommunityModelMock.prototype.save = function(callback) {
        callback(null, response);
      };
      CommunityModelMock.testTitleDomain = function(title, ids, callback) {
        return callback();
      };

      pubsubMock.local = {
        topic: function(name) {
          if (name === CONSTANTS.EVENTS.communityCreated) {
            return {
              publish: spy
            };
          }
        }
      };

      getModule().save({domain_ids: [123], title: 'title'}, function(err, result) {
        expect(err).to.not.be.defined;
        expect(result).to.deep.equal(response);
        expect(spy).to.have.been.calledWith(response);
        done();
      });
    });
  });

  describe('The load method', function() {
    it('should send back error if community is undefined', function(done) {
      getModule().load(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call mongoose#findOne', function(done) {
      CommunityModelMock.findOne = function() { return done(); };

      getModule().load(123, function(err) {
        expect(err).to.not.exist;
      });
    });
  });

  describe('The loadWithDomain method', function() {
    it('should send back error if community is undefined', function(done) {
      getModule().loadWithDomains(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call mongoose#findOne', function(done) {
      CommunityModelMock.findOne = function() {
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

      getModule().loadWithDomains(123, function(err) {
        expect(err).to.not.exist;
      });
    });
  });

  describe('The query method', function() {
    it('should call collaboration.query with the "community" objectType', function(done) {
      collaborationMock.query = function(objectType) {
        expect(objectType).to.equal('community');
        done();
      };

      getModule().query(null, function() {});
    });
  });

  describe('The delete method', function() {
    it('should reject when community is undefined', function(done) {
      getModule().delete(null, {}).then(() => done(new Error('Should not occur'))).catch(() => done());
    });

    it('should send back error if user is undefined', function(done) {
      getModule().delete({}).then(() => done(new Error('Should not occur'))).catch(() => done());
    });

    it('should reject when archive call rejects', function(done) {
      const error = new Error('I can not archive community');
      const community = { _id: 1 };
      const user = { _id: 2 };
      const archive = {
        process: sinon.stub().returns(Promise.reject(error))
      };

      mockery.registerMock('./archive', () => archive);

      getModule().delete(community, user).then(() => done(new Error('Should not occur'))).catch(err => {
        expect(archive.process).to.have.been.calledWith(community, user);
        expect(err).to.equal(error);
        done();
      });
    });

    it('should resolve when archive call resolves', function(done) {
      const community = { _id: 1 };
      const user = { _id: 2 };
      const archive = {
        process: sinon.stub().returns(Promise.resolve())
      };

      mockery.registerMock('./archive', () => archive);

      getModule().delete(community, user).then(() => {
        expect(archive.process).to.have.been.calledWith(community, user);
        done();
      }).catch(done);
    });
  });

  describe('The updateAvatar method', function() {
    it('should send back error when community is undefined', function(done) {
      getModule().updateAvatar(null, 1, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when avatar id is undefined', function(done) {
      getModule().updateAvatar({}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('The isManager method', function() {
    it('should send back error when Community.findById fails', function(done) {
      const communityPopulateMock = sinon.spy();

      CommunityModelMock.findById = () => ({
        populate: communityPopulateMock,
        exec: callback => callback(new Error())
      });

      getModule().member.isManager(123, 456, err => {
        expect(err).to.exist;
        expect(communityPopulateMock).to.have.been.calledWith('domain_ids');
        done();
      });
    });

    it('should send back true when user is creator', function(done) {
      const creator = { _id: 'creator' };
      const communityPopulateMock = sinon.spy();
      const populatedCommunity = {
        creator: creator._id,
        domain_ids: []
      };

      CommunityModelMock.findById = () => ({
        populate: communityPopulateMock,
        exec: callback => callback(null, populatedCommunity)
      });

      getModule().member.isManager(123, { _id: creator._id }, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        expect(communityPopulateMock).to.have.been.calledWith('domain_ids');
        done();
      });
    });

    it('should send back true when user is domain administrator', function(done) {
      const creator = { _id: 'creator' };
      const admin = { _id: 'admin' };

      const communityPopulateMock = sinon.spy();

      const populatedCommunity = {
        creator: creator._id,
        domain_ids: [{
          administrators: [{
            user_id: admin._id
          }]
        }]
      };

      domainModuleMock.getDomainAdministrators = () => [{ user_id: admin._id }];

      CommunityModelMock.findById = () => ({
        populate: communityPopulateMock,
        exec: callback => callback(null, populatedCommunity)
      });

      getModule().member.isManager(123, { _id: admin._id }, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        expect(communityPopulateMock).to.have.been.calledWith('domain_ids');
        done();
      });
    });

    it('should send back false when user is domain administrator', function(done) {
      const creator = { _id: 'creator' };
      const admin = { _id: 'admin' };
      const user = { _id: 'user' };

      const communityPopulateMock = sinon.spy();

      const populatedCommunity = {
        creator: creator._id,
        domain_ids: [{
          administrators: [{
            user_id: admin._id
          }]
        }]
      };

      domainModuleMock.getDomainAdministrators = () => [{ user_id: admin._id }];

      CommunityModelMock.findById = () => ({
        populate: communityPopulateMock,
        exec: callback => callback(null, populatedCommunity)
      });

      getModule().member.isManager(123, { _id: user._id }, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(communityPopulateMock).to.have.been.calledWith('domain_ids');
        done();
      });
    });
  });

  describe('The isMember method', function() {
    it('should send back error if failed to check isMember', function(done) {
      const tuple = { objectType: 'user', id: 456 };
      const community = { _id: 'communityId' };
      const error = new Error('something wrong');

      collaborationMock.member = {
        isMember: (_community, _tuple, callback) => {
          expect(_community).to.deep.equal(community);
          expect(_tuple).to.deep.equal(tuple);
          callback(error);
        }
      };
      CommunityModelMock.findOne = () => {};

      getModule().member.isMember(community, tuple, function(err) {
        expect(err.message).to.equal(error.message);

        return done();
      });
    });

    it('should send back true when isMember return true', function(done) {
      const tuple = { objectType: 'user', id: 456 };
      const community = { _id: 'communityId' };

      collaborationMock.member = {
        isMember: (_community, _tuple, callback) => {
          expect(_community).to.deep.equal(community);
          expect(_tuple).to.deep.equal(tuple);
          callback(null, true);
        }
      };

      getModule().member.isMember(community, tuple, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;

        return done();
      });
    });

    it('should send back false when isMember return false', function(done) {
      const tuple = { objectType: 'user', id: 456 };
      const community = { _id: 'communityId' };

      collaborationMock.member = {
        isMember: (_community, _tuple, callback) => {
          expect(_community).to.deep.equal(community);
          expect(_tuple).to.deep.equal(tuple);
          callback(null, false);
        }
      };

      getModule().member.isMember(community, tuple, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;

        return done();
      });
    });
  });

  describe('The getMembers method', function() {
    it('should send back error when Community.findById fails', function(done) {
      CommunityModelMock.findById = function(id, callback) {
        return callback(new Error());
      };

      getModule().member.getMembers({_id: 123}, null, function(err) {
        expect(err).to.exist;

        return done();
      });
    });

    it('should send back [] when Community.exec does not find members', function(done) {
      CommunityModelMock.findById = function(id, callback) {
        return callback(null, {members: []});
      };
      UserModelMock.find = function(query, callback) {
        return callback(null, []);
      };

      getModule().member.getMembers({_id: 123}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.an.array;
        expect(result.length).to.equal(0);

        return done();
      });
    });

    it('should send back result members', function(done) {
      const result = [{member: {_id: 'id1', firstname: 'user1'}}, {member: {_id: 'id2', firstname: 'user2'}}];

      CommunityModelMock.findById = function(id, callback) {
        return callback(null, {members: [
          {member: {id: 'id1', objectType: 'user'}},
          {member: {id: 'id2', objectType: 'user'}}
        ]});
      };
      UserModelMock.find = function(query, callback) {
        expect(query._id.$in).to.be.an('array');
        expect(query._id.$in).to.have.length(2);
        expect(query._id.$in).to.contain('id1');
        expect(query._id.$in).to.contain('id2');

        return callback(null, [
          {_id: 'id1', firstname: 'user1'},
          {_id: 'id2', firstname: 'user2'}
        ]);
      };

      getModule().member.getMembers({_id: 123}, {}, function(err, members) {
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

      CommunityModelMock.findById = function(id, callback) {
        return callback(null, {members: [
          {member: {id: 'id1', objectType: 'user'}},
          {member: {id: 'id2', objectType: 'user'}},
          {member: {id: 'id3', objectType: 'user'}},
          {member: {id: 'id4', objectType: 'user'}},
          {member: {id: 'id5', objectType: 'user'}},
          {member: {id: 'id6', objectType: 'user'}}
        ]});
      };
      UserModelMock.find = function(query, callback) {
        expect(query._id.$in).to.be.an('array');
        expect(query._id.$in).to.have.length(2);
        expect(query._id.$in).to.contain('id4');
        expect(query._id.$in).to.contain('id5');

        return done();
      };

      getModule().member.getMembers({_id: 123}, query, function() {});
    });

    it('should slice members even if query is not defined', function(done) {
      CommunityModelMock.findById = function(a, callback) {
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

      UserModelMock.find = function() {};

      getModule().member.getMembers({_id: 123}, {}, function() {
        done();
      });
    });
  });

  describe('The getManagers method', function() {
    it('should send back error when Community.exec fails', function(done) {
      CommunityModelMock.findById = function() {
        return {
          slice: function() {},
          populate: function() {},
          exec: function(callback) {
            return callback(new Error());
          }
        };
      };

      getModule().member.getManagers({_id: 123}, null, function(err) {
        expect(err).to.exist;

        return done();
      });
    });

    it('should send back [] if there is no community is found', function(done) {
      const communityPopulateMock = sinon.spy();

      CommunityModelMock.findById = () => ({
        populate: communityPopulateMock,
        exec: callback => callback()
      });

      getModule().member.getManagers({ _id: 123 }, {}, (err, result) => {
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

      const communityPopulateMock = sinon.spy();
      const userFindMock = sinon.spy((query, callback) => {
        expect(query).to.deep.equal({ _id: { $in: [creator._id, user1._id, user2._id, user3._id] }});
        callback(null, [creator, user1, user2, user3]);
      });
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

      const populatedCommunity = {
        creator: creator._id,
        domain_ids: domains
      };

      CommunityModelMock.findById = () => ({
        populate: communityPopulateMock,
        exec: callback => callback(null, populatedCommunity)
      });

      UserModelMock.find = userFindMock;

      domainModuleMock.getDomainAdministrators = domain => domain.administrators;

      getModule().member.getManagers({ _id: 123 }, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.an.array;
        expect(result).to.deep.equal([creator, user1, user2, user3]);
        expect(communityPopulateMock).to.have.been.calledWith('domain_ids');
        expect(userFindMock).to.have.been.calledOnce;
        done();
      });
    });
  });

  describe('The getUserCommunities method', function() {
    it('should send back error when user is null', function(done) {
      getModule().getUserCommunities(null, function(err) {
        expect(err).to.exist;

        return done();
      });
    });
  });

  describe('userToMember method', function() {
    it('should send back result even if user is null', function(done) {
      expect(getModule().userToMember(null)).to.exist;
      done();
    });

    it('should send back result even if document.user is null', function(done) {
      expect(getModule().userToMember({})).to.exist;
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
      const member = getModule().userToMember({member: user});

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
    it('should return nothing if user does not have a membership request', function() {
      const user = {_id: 'user1'};
      const community = {_id: 'community1', membershipRequests: [{
        user: { equals: function() { return false; } },
        timestamp: {creation: new Date()}
      }]};

      collaborationMock.member = {
        getMembershipRequest: (_community, _user) => {
          expect(_community).to.deep.equal(community);
          expect(_user).to.deep.equal(user);

          return;
        }
      };
      expect(getModule().member.getMembershipRequest(community, user)).to.be.not.ok;
    });

    it('should return the membership object if user have a membership request', function() {
      const user = {_id: 'user1'};
      const community = {_id: 'community1', membershipRequests: [{
        user: { equals: function() { return true; } },
        timestamp: {creation: new Date(1419509532000)}
      }]};

      collaborationMock.member = {
        getMembershipRequest: (_community, _user) => {
          expect(_community).to.deep.equal(community);
          expect(_user).to.deep.equal(user);

          return community.membershipRequests[0];
        }
      };
      const mr = getModule().member.getMembershipRequest(community, user);

      expect(mr).to.be.ok;
      expect(mr.timestamp).to.have.property('creation');
      expect(mr.timestamp.creation).to.be.a('Date');
      expect(mr.timestamp.creation.getTime()).to.equal(1419509532000);
    });
  });

  describe('The getMembershipRequests method', function() {
    it('should send back error when Community.exec fails', function(done) {
      const community = { _id: 123 };
      const query = { foo: 'bar' };

      collaborationMock.member = {
        getMembershipRequests: (objectType, communityId, _query, callback) => {
          expect(objectType).to.equal('community');
          expect(communityId).to.deep.equal(community._id);
          expect(_query).to.deep.equal(query);
          callback(new Error('something wrong'));
        }
      };

      getModule().member.getMembershipRequests(community, query, function(err) {
        expect(err).to.exist;

        return done();
      });
    });

    it('should send back [] when Community.exec does not find requests', function(done) {
      const community = { _id: 123 };
      const query = { foo: 'bar' };

      collaborationMock.member = {
        getMembershipRequests: (objectType, communityId, _query, callback) => {
          expect(objectType).to.equal('community');
          expect(communityId).to.deep.equal(community._id);
          expect(_query).to.deep.equal(query);
          callback(null, []);
        }
      };

      getModule().member.getMembershipRequests(community, query, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.an.array;
        expect(result.length).to.equal(0);

        return done();
      });
    });

    it('should send back result requests', function(done) {
      const result = [{user: 1}, {user: 2}];
      const community = { _id: 123 };
      const query = { foo: 'bar' };

      collaborationMock.member = {
        getMembershipRequests: (objectType, communityId, _query, callback) => {
          expect(objectType).to.equal('community');
          expect(communityId).to.deep.equal(community._id);
          expect(_query).to.deep.equal(query);
          callback(null, result);
        }
      };

      getModule().member.getMembershipRequests(community, query, function(err, requests) {
        expect(err).to.not.exist;
        expect(requests).to.be.an.array;
        expect(requests).to.deep.equal(result);

        return done();
      });
    });
  });

  describe('The cleanMembershipRequest method', function() {
    it('should send back error if failed to clean membership request', function(done) {
      const community = { _id: 'community' };
      const user = { _id: '123' };

      collaborationMock.member = {
        cleanMembershipRequest: (_community, _user, callback) => {
          expect(_community).to.deep.equal(community);
          expect(_user).to.deep.equal(user);
          callback(new Error('something wrong'));
        }
      };
      getModule().member.cleanMembershipRequest(community, user, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should resolve without error if success to clean membership request', function(done) {
      const community = { _id: 'community' };
      const user = { _id: '123' };

      collaborationMock.member = {
        cleanMembershipRequest: (_community, _user, callback) => {
          expect(_community).to.deep.equal(community);
          expect(_user).to.deep.equal(user);
          callback();
        }
      };
      getModule().member.cleanMembershipRequest(community, user, function(err) {
        expect(err).to.not.exist;
        done();
      });
    });
  });
});
