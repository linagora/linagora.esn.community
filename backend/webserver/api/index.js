'use strict';

const express = require('express');

module.exports = function(dependencies) {

  const router = express.Router();
  const moduleName = 'linagora.esn.community';

  require('./community')(dependencies, router, moduleName);

  return router;
};
