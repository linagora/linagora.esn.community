const acceptedImageTypes = ['image/jpeg', 'image/gif', 'image/png'];

module.exports = dependencies => {
  const communityModule = dependencies('community');
  const { permission } = dependencies('community');
  const { CONSTANT: collaborationConstants } = dependencies('collaboration');
  const imageModule = dependencies('image');
  const escapeStringRegexp = require('escape-string-regexp');
  const logger = dependencies('logger');
  const _ = require('lodash');
  const async = require('async');
  const mongoose = dependencies('db').mongo.mongoose;
  const Community = mongoose.model('Community');
  const ObjectId = mongoose.Types.ObjectId;  

  return {
    create,
    delete: remove,
    get,
    getMember,
    getMembers,
    getMembershipRequests,
    getMine,
    join,
    leave,
    list,
    load,
    loadDomainForCreate,
    removeMembershipRequest,
    update,
    uploadAvatar
  };

  function transform(community, user, callback) {
    if (!community) {
      return {};
    }

    var membershipRequest = communityModule.member.getMembershipRequest(community, user);
    var membersRequests = _.filter(community.membershipRequests, { workflow: 'request' });
    var membersInvitations = _.filter(community.membershipRequests, { workflow: 'invitation' });

    if (typeof community.toObject === 'function') {
      community = community.toObject();
    }

    community.members_requests_count = membersRequests ? membersRequests.length : 0;
    community.members_invitations_count = membersInvitations ? membersInvitations.length : 0;
    community.members_count = community.members ? community.members.length : 0;
    if (membershipRequest) {
      community.membershipRequest = membershipRequest.timestamp.creation.getTime();
    }

    communityModule.member.isMember(community, { objectType: 'user', id: user.id }, function(err, membership) {
      if (membership) {
        community.member_status = 'member';
      } else {
        community.member_status = 'none';
      }
      delete community.members;
      delete community.membershipRequests;

      return callback(community);
    });
  }

  function ensureLoginCommunityAndUserId(req, res) {
    var community = req.community;
    var user = req.user;

    if (!user) {
      res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'You must be logged in to access this resource' } });

      return false;
    }

    if (!req.params || !req.params.user_id) {
      res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'The user_id parameter is missing' } });

      return false;
    }

    if (!community) {
      res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'Community is missing' } });

      return false;
    }

    return true;
  }

  function loadDomainForCreate(req, res, next) {
    const domains = req.body.domain_ids;

    if (!domains) {
      return res.status(400).json({ error: { status: 400, message: 'Bad request', details: 'Domain ids is mandatory' } });
    }
    if (domains.length === 0) {
      return res.status(400).json({ error: { status: 400, message: 'Bad request', details: 'Domain id is mandatory' } });
    }
    req.params.uuid = domains[0];
    var domainMiddleware = dependencies('domainMW');

    return domainMiddleware.load(req, res, next);
  }

  function save(community, user, res) {
    communityModule.save(community, function(err, saved) {
      if (err) {
        return res.status(500).json({ error: { status: 500, message: 'Community save error', details: err } });
      }
      transform(saved, user, function(result) {
        return res.status(201).json(result);
      });
    });
  }

  function create(req, res) {
    const community = {
      title: req.body.title,
      creator: req.user._id,
      members: [
        { member: { id: req.user._id, objectType: 'user' } }
      ]
    };

    if (!community.title) {
      return res.status(400).json({ error: { status: 400, message: 'Bad request', details: 'Community title is mandatory' } });
    }

    if (!req.body.domain_ids) {
      return res.status(400).json({ error: { status: 400, message: 'Bad request', details: 'Community domain is mandatory' } });
    }

    if (req.body.domain_ids.length === 0) {
      return res.status(400).json({ error: { status: 400, message: 'Bad request', details: 'At least a domain is required' } });
    }

    community.domain_ids = req.body.domain_ids;

    if (req.body.type) {
      community.type = req.body.type;
    }

    if (req.body.description) {
      community.description = req.body.description;
    }

    if (req.body.avatar) {
      community.avatar = new ObjectId(req.body.avatar);
    }

    if (req.query.noTitleCheck) {
      save(community, req.user, res);
    } else {
      Community.testTitleDomain(community.title, community.domain_ids, function(err, result) {
        if (err) {
          return res.status(500).json({ error: { status: 500, message: 'Community save error : Unable to lookup title/domain', details: err } });
        }
        if (result) {
          return res.status(403).json({ error: { status: 403, message: 'Title/domain: ' + community.title + '/' + community.domain_id + ' already exist.', details: err } });
        }
        save(community, req.user, res);
      });
    }
  }

  function list(req, res) {
    const query = {};

    if (req.domain) {
      query.domain_ids = [req.domain._id];
    }

    if (req.query.creator) {
      query.creator = req.query.creator;
    }

    if (req.query.type) {
      query.type = req.query.type;
    }

    if (req.query.title) {
      const escapedString = escapeStringRegexp(req.query.title);

      query.title = new RegExp('^' + escapedString + '$', 'i');
    }

    communityModule.query(query, function(err, response) {
      if (err) {
        return res.status(500).json({ error: { code: 500, message: 'Community list failed', details: err.message}});
      }

      async.filter(response, function(community, callback) {
        permission.canFind(community, { objectType: 'user', id: req.user._id }, callback);
      }, function(err, filterResults) {
        async.map(filterResults, function(community, callback) {
          transform(community, req.user, function(transformed) {
            return callback(null, transformed);
          });
        }, function(err, mapResults) {
          return res.status(200).json(mapResults);
        });
      });
    });
  }

  function load(req, res, next) {
    communityModule.load(req.params.id, function(err, community) {
      if (err) {
        return next(err);
      }
      if (!community) {
        return res.status(404).json({ error: 404, message: 'Not found', details: 'Community not found' });
      }
      req.community = community;

      return next();
    });
  }

  function get(req, res) {
    if (req.community) {
      const userTuple = { objectType: 'user', id: String(req.user._id) };

      permission.canFind(req.community, userTuple, function(err, canFind) {
        if (err) {
          return res.status(500).json({ error: 500, message: 'Server Error', details: 'Could not find community' });
        }
        if (canFind) {
          transform(req.community, req.user, function(transformed) {
            permission.canWrite(req.community, userTuple, function(err, writable) {
              const result = transformed;

              result.writable = writable;

              return res.status(200).json(result);
            });
          });
        } else {
          return res.status(403).json({ error: 403, message: 'Forbidden', details: 'Community not readable' });
        }
      });
    } else {
      return res.status(404).json({ error: 404, message: 'Not found', details: 'Community not found' });
    }
  }

  function remove(req, res) {
    if (!req.community) {
      return res.status(404).json({ error: 404, message: 'Not found', details: 'Community not found' });
    }

    communityModule.delete(req.community, req.user)
      .then(() => res.status(204).end())
      .catch(err => res.status(500).json({ error: { status: 500, message: 'Error while deleting community', details: err.message } }));
  }

  function update(req, res) {
    if (!req.community) {
      return res.status(404).json({ error: 404, message: 'Not found', details: 'Community not found' });
    }

    if (_.isEmpty(req.body)) {
      return res.status(400).json({ error: 400, message: 'No Parameters', details: 'No parameters send.' });
    }

    function updateCommunity() {
      communityModule.update(req.community, req.body, function(err) {
        if (err) {
          return res.status(500).json({ error: 500, message: 'Datastore failure', details: err.message });
        }

        return res.status(200).end();
      });
    }

    return updateCommunity();
  }

  function uploadAvatar(req, res) {
    if (!req.community) {
      return res.status(404).json({ error: 404, message: 'Not found', details: 'Community not found' });
    }

    if (!req.query.mimetype) {
      return res.status(400).json({ error: 400, message: 'Parameter missing', details: 'mimetype parameter is required' });
    }

    const mimetype = req.query.mimetype.toLowerCase();

    if (acceptedImageTypes.indexOf(mimetype) < 0) {
      return res.status(400).json({ error: 400, message: 'Bad parameter', details: 'mimetype ' + req.query.mimetype + ' is not acceptable' });
    }

    if (!req.query.size) {
      return res.status(400).json({ error: 400, message: 'Parameter missing', details: 'size parameter is required' });
    }

    const size = parseInt(req.query.size, 10);

    if (isNaN(size)) {
      return res.status(400).json({ error: 400, message: 'Bad parameter', details: 'size parameter should be an integer' });
    }
    var avatarId = new ObjectId();

    function updateCommunityAvatar() {
      communityModule.updateAvatar(req.community, avatarId, function(err) {
        if (err) {
          return res.status(500).json({ error: 500, message: 'Datastore failure', details: err.message });
        }

        return res.status(200).json({_id: avatarId});
      });
    }

    function avatarRecordResponse(err, storedBytes) {
      if (err) {
        if (err.code === 1) {
          return res.status(500).json({ error: 500, message: 'Datastore failure', details: err.message });
        } else if (err.code === 2) {
          return res.status(500).json({ error: 500, message: 'Image processing failure', details: err.message });
        } else {
          return res.status(500).json({ error: 500, message: 'Internal server error', details: err.message });
        }
      } else if (storedBytes !== size) {
        return res.status(412).json({ error: 412, message: 'Image size does not match', details: 'Image size given by user agent is ' + size +
          ' and image size returned by storage system is ' + storedBytes });
      }
      updateCommunityAvatar();
    }

    const metadata = {};

    if (req.user) {
      metadata.creator = { objectType: 'user', id: req.user._id };
    }

    return imageModule.recordAvatar(avatarId, mimetype, metadata, req, avatarRecordResponse);
  }

  function getAvatar(req, res) {
    if (!req.community) {
      return res.status(404).json({ error: 404, message: 'Not found', details: 'Community not found' });
    }

    if (!req.community.avatar) {
      return res.redirect('/images/community.png');
    }

    imageModule.getAvatar(req.community.avatar, req.query.format, function(err, fileStoreMeta, readable) {
      if (err) {
        logger.warn('Can not get community avatar : %s', err.message);

        return res.redirect('/images/community.png');
      }

      if (!readable) {
        logger.warn('Can not retrieve avatar stream for community %s', req.community._id);

        return res.redirect('/images/community.png');
      }

      if (req.headers['if-modified-since'] && Number(new Date(req.headers['if-modified-since']).setMilliseconds(0)) === Number(fileStoreMeta.uploadDate.setMilliseconds(0))) {
        return res.status(304).end();
      } else {
        res.header('Last-Modified', fileStoreMeta.uploadDate);
        res.status(200);

        return readable.pipe(res);
      }
    });
  }

  function getMine(req, res) {
    var user = req.user;

    if (!user) {
      return res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'User is missing' } });
    }

    communityModule.getUserCommunities(user._id, { member: true }, function(err, communities) {
      if (err) {
        return res.status(500).json({ error: { code: 500, message: 'Server Error', details: err.details } });
      }
      async.map(communities, function(community, callback) {
        transform(community, req.user, function(transformed) {
          return callback(null, transformed);
        });
      }, function(err, results) {
        return res.status(200).json(results);
      });
    });
  }

  function getMembers(req, res) {
    const community = req.community;

    if (!community) {
      return res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'Community is missing' } });
    }

    const query = {};

    if (req.query.limit) {
      const limit = parseInt(req.query.limit, 10);

      if (!isNaN(limit)) {
        query.limit = limit;
      }
    }

    if (req.query.offset) {
      const offset = parseInt(req.query.offset, 10);

      if (!isNaN(offset)) {
        query.offset = offset;
      }
    }

    communityModule.member.getMembers(community, query, function(err, members) {
      if (err) {
        return res.status(500).json({ error: { code: 500, message: 'Server Error', details: err.details } });
      }
      res.header('X-ESN-Items-Count', req.community.members ? req.community.members.length : 0);
      var result = members.map(function(member) {
        return communityModule.userToMember(member);
      });

      return res.status(200).json(result || []);
    });
  }

  function getMember(req, res) {
    const community = req.community;

    if (!community) {
      return res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'Community is missing' } });
    }

    communityModule.member.isMember(community, { objectType: 'user', id: req.params.user_id }, function(err, result) {
      if (err) {
        return res.status(500).json({ error: { code: 500, message: 'Server Error', details: err.details } });
      }

      if (result) {
        return res.status(200).end();
      }

      return res.status(404).end();
    });
  }

  function join(req, res) {
    if (!ensureLoginCommunityAndUserId(req, res)) {
      return;
    }
    const community = req.community;
    const user = req.user;
    const targetUserId = req.params.user_id;

    if (req.isCommunityManager) {

      if (user._id.equals(targetUserId)) {
        return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'Community Manager can not add himself to a community' } });
      }

      if (!communityModule.member.getMembershipRequest(community, {_id: targetUserId})) {
        return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'User did not request to join community' } });
      }

      communityModule.join(community, user, targetUserId, 'manager', function(err) {
        if (err) {
          return res.status(500).json({ error: { code: 500, message: 'Server Error', details: err.details } });
        }

        communityModule.member.cleanMembershipRequest(community, targetUserId, function(err) {
          if (err) {
            return res.status(500).json({ error: { code: 500, message: 'Server Error', details: err.details } });
          }

          return res.status(204).end();
        });
      });

    } else {

      if (!user._id.equals(targetUserId)) {
        return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'Current user is not the target user' } });
      }

      if (req.community.type !== collaborationConstants.COLLABORATION_TYPES.OPEN) {
        const membershipRequest = communityModule.member.getMembershipRequest(community, user);

        if (!membershipRequest) {
          return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'User was not invited to join community' } });
        }

        communityModule.join(community, user, user, null, function(err) {
          if (err) {
            return res.status(500).json({ error: { code: 500, message: 'Server Error', details: err.details } });
          }

          communityModule.member.cleanMembershipRequest(community, user, function(err) {
            if (err) {
              return res.status(500).json({ error: { code: 500, message: 'Server Error', details: err.details } });
            }

            return res.status(204).end();
          });
        });
      } else {
        communityModule.join(community, user, targetUserId, 'user', function(err) {
          if (err) {
            return res.status(500).json({ error: { code: 500, message: 'Server Error', details: err.details } });
          }

          communityModule.member.cleanMembershipRequest(community, user, function(err) {
            if (err) {
              return res.status(500).json({ error: { code: 500, message: 'Server Error', details: err.details } });
            }

            return res.status(204).end();
          });
        });
      }
    }
  }

  function leave(req, res) {
    if (!ensureLoginCommunityAndUserId(req, res)) {
      return;
    }
    const community = req.community;
    const user = req.user;
    const targetUserId = req.params.user_id;

    communityModule.leave(community, user, targetUserId, function(err) {
      if (err) {
        return res.status(500).json({ error: { code: 500, message: 'Server Error', details: err.details } });
      }

      return res.status(204).end();
    });
  }

  function getMembershipRequests(req, res) {
    var community = req.community;

    if (!community) {
      return res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'Community is missing' } });
    }

    if (!req.isCommunityManager) {
      return res.status(403).json({ error: { code: 403, message: 'Forbidden', details: 'Only community managers can get requests' } });
    }

    const query = {};

    if (req.query.limit) {
      const limit = parseInt(req.query.limit, 10);

      if (!isNaN(limit)) {
        query.limit = limit;
      }
    }

    if (req.query.offset) {
      const offset = parseInt(req.query.offset, 10);

      if (!isNaN(offset)) {
        query.offset = offset;
      }
    }

    communityModule.member.getMembershipRequests(community, query, function(err, membershipRequests) {
      if (err) {
        return res.status(500).json({ error: { code: 500, message: 'Server Error', details: err.details } });
      }
      res.header('X-ESN-Items-Count', req.community.membershipRequests ? req.community.membershipRequests.length : 0);
      const result = membershipRequests.map(function(request) {
        var result = communityModule.userToMember({ member: request.user, timestamp: request.timestamp });

        result.workflow = request.workflow;
        result.timestamp = request.timestamp;

        return result;
      });

      return res.status(200).json(result || []);
    });
  }

  function removeMembershipRequest(req, res) {
    if (!ensureLoginCommunityAndUserId(req, res)) {
      return;
    }
    if (!req.isCommunityManager && !req.user._id.equals(req.params.user_id)) {
      return res.status(403).json({ error: { code: 403, message: 'Forbidden', details: 'Current user is not the target user' } });
    }

    if (!req.community.membershipRequests || !('filter' in req.community.membershipRequests)) {
      return res.status(204).end();
    }

    var memberships = req.community.membershipRequests.filter(function(mr) {
      return mr.user.equals(req.params.user_id);
    });

    if (!memberships.length) {
      return res.status(204).end();
    }
    var membership = memberships[0];

    function onResponse(err) {
      if (err) {
        return res.status(500).json({ error: { code: 500, message: 'Server Error', details: err.message } });
      }
      res.status(204).end();
    }

    /*
    *      workflow   |   isCommunityManager   |  What does it mean ?
    *      -----------------------------------------------------------
    *      INVITATION |           yes          | manager cancel the invitation of the user
    *      INVITATION |            no          | attendee declines the invitation
    *      REQUEST    |           yes          | manager refuses the user's request to enter the community
    *      REQUEST    |            no          | user cancels her request to enter the commity
    */

    if (req.isCommunityManager) {
      if (membership.workflow === communityModule.MEMBERSHIP_TYPE_INVITATION) {
        communityModule.member.cancelMembershipInvitation(req.community, membership, req.user, onResponse);
      } else {
        communityModule.member.refuseMembershipRequest(req.community, membership, req.user, onResponse);
      }
    } else if (membership.workflow === communityModule.member.MEMBERSHIP_TYPE_INVITATION) {
      communityModule.member.declineMembershipInvitation(req.community, membership, req.user, onResponse);
    } else {
      communityModule.member.cancelMembershipRequest(req.community, membership, req.user, onResponse);
    }
  }
};