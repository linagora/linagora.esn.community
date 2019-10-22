module.exports = dependencies => {
  const communityModule = dependencies('community');
  const {permission: communityPermission} = communityModule;
  const { CONSTANTS: collaborationConstants } = dependencies('collaboration');
  const mongoose = dependencies('db').mongo.mongoose;
  const Community = mongoose.model('Community');
  const logger = dependencies('logger');
  const activitystreamMW = dependencies("activitystreamMW");

  activitystreamMW.addStreamResourceFinder(findStreamResource);
  activitystreamMW.addStreamWritableFinder(filterWritableTargets);

  return {
    canJoin,
    canLeave,
    canRead,
    checkUserIdParameterIsCurrentUser,
    checkUserParamIsNotMember,
    filterWritableTargets,
    findStreamResource,
    flagCommunityManager,
    isCreator,
    requiresCommunityManager,
    requiresCommunityMember
  };

  function findStreamResource(req, res, next) {
    const uuid = req.params.uuid;

    Community.getFromActivityStreamID(uuid, function(err, community) {
      if (err) {
        return next(new Error('Error while searching the stream resource : ' + err.message));
      }

      if (!community) {
        return next();
      }

      req.activity_stream = {
        objectType: 'activitystream',
        _id: uuid,
        target: {
          objectType: 'community',
          object: community
        }
      };
      next();
    });
  }

  function filterWritableTargets(req, res, next) {
    const inReplyTo = req.body.inReplyTo;

    if (inReplyTo) {
      return next();
    }

    const targets = req.body.targets;

    if (!targets || targets.length === 0) {
      return next();
    }

    const async = require('async');

    async.filter(targets,
      function(item, callback) {
        Community.getFromActivityStreamID(item.id, function(err, community) {

          if (err || !community) {
            return callback(err, false);
          }

          communityPermission.canWrite(community, { objectType: 'user', id: req.user.id }, callback);
        });
      },
      function(err, results) {
        if (!results || results.length === 0) {
          return next();
        }

        if (!req.message_targets) {
          req.message_targets = [];
        }

        req.message_targets = req.message_targets.concat(results);
        next();
      }
    );
  }

  function canJoin(req, res, next) {
    if (!req.community) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing community' });
    }

    if (!req.user) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing user' });
    }

    if (!req.params || !req.params.user_id) {
      return res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'User_id is missing' } });
    }

    if (req.community.type !== collaborationConstants.COLLABORATION_TYPES.OPEN) {
      return res.status(403).json({ error: 403, message: 'Forbidden', details: 'Can not join community' });
    }

    return next();
  }

  function canLeave(req, res, next) {
    if (!req.community) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing community' });
    }

    if (!req.user) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing user' });
    }

    if (!req.params || !req.params.user_id) {
      return res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'User_id is missing' } });
    }

    if (req.user._id.equals(req.community.creator)) {
      return res.status(403).json({ error: 403, message: 'Forbidden', details: 'Creator can not leave community' });
    }

    return next();
  }

  function requiresCommunityMember(req, res, next) {
    if (!req.community) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing community' });
    }

    if (!req.user) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing user' });
    }

    communityModule.member.isMember(req.community, { objectType: 'user', id: req.user._id }, function(err, isMember) {
      if (err) {
        return res.status(400).json({ error: 400, message: 'Bad request', details: 'Can not define the community membership : ' + err.message });
      }

      if (!isMember) {
        return res.status(403).json({ error: 403, message: 'Forbidden', details: 'User is not community member' });
      }

      return next();
    });
  }

  function checkUserParamIsNotMember(req, res, next) {
    if (!req.community) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing community' });
    }

    if (!req.params.user_id) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing user id' });
    }

    communityModule.member.isMember(req.community, req.params.user_id, function(err, isMember) {
      if (err) {
        return res.status(400).json({ error: 400, message: 'Bad request', details: 'Can not define the community membership : ' + err.message });
      }

      if (isMember) {
        return res.status(400).json({ error: 400, message: 'Bad request', details: 'User is already member of the community.' });
      }

      return next();
    });
  }

  function isCreator(req, res, next) {
    if (!req.community) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing community' });
    }

    if (!req.user) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing user' });
    }

    if (!req.user._id.equals(req.community.creator)) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Not the community creator' });
    }

    return next();
  }

  function checkUserIdParameterIsCurrentUser(req, res, next) {
    if (!req.user) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing user' });
    }

    if (!req.params.user_id) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing user id' });
    }

    if (!req.user._id.equals(req.params.user_id)) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Parameters do not match' });
    }

    return next();
  }

  function canRead(req, res, next) {
    if (!req.community) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing community' });
    }

    if (!req.user) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing user' });
    }

    if (req.community.type === collaborationConstants.COLLABORATION_TYPES.OPEN ||
      req.community.type === collaborationConstants.COLLABORATION_TYPES.RESTRICTED) {
      return next();
    }

    return requiresCommunityMember(req, res, next);
  }

  function flagCommunityManager(req, res, next) {
    if (!req.community) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing community' });
    }

    if (!req.user) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing user' });
    }

    communityModule.member.isManager(req.community, req.user, function(err, manager) {
      if (err) {
        return res.status(500).json({ error: { code: 500, message: 'Error when checking if the user is a manager', details: err.message } });
      }
      req.isCommunityManager = manager;
      next();
    });
  }

  function requiresCommunityManager(req, res, next) {
    if (!req.community) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing community' });
    }

    if (!req.user) {
      return res.status(400).json({ error: 400, message: 'Bad request', details: 'Missing user' });
    }

    communityModule.member.isManager(req.community, req.user, function(err, manager) {
      if (err) {
        logger.error('Error when checking if the user is a manager', err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Error when checking if the user is a manager'
          }
        });
      }

      if (!manager) {
        return res.status(403).json({
          error: 403,
          message: 'Forbidden',
          details: 'User is not community manager'
        });
      }

      next();
    });
  }
};