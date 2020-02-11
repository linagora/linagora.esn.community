module.exports = dependencies => {
  const communityModule = dependencies('community');
  const { CONSTANTS: collaborationConstants } = dependencies('collaboration');
  const logger = dependencies('logger');

  return {
    canJoin,
    canLeave,
    canRead,
    checkUserIdParameterIsCurrentUser,
    checkUserParamIsNotMember,
    flagCommunityManager,
    isCreator,
    requiresCommunityManager,
    requiresCommunityMember
  };

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
