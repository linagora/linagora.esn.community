'use strict';

const express = require('express');

module.exports = function(dependencies) {

  const router = express.Router();

  router.use('/communities', require('./community')(dependencies, router));

  return router;
};
