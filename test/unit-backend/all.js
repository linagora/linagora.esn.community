'use strict';

const mockery = require('mockery');
const chai = require('chai');
const path = require('path');
let backendPath = path.normalize(__dirname + '/../../backend');
let rse;

before(function() {
  chai.use(require('chai-shallow-deep-equal'));
  chai.use(require('sinon-chai'));
  chai.use(require('chai-as-promised'));

  const basePath = path.resolve(__dirname + '/../../node_modules/linagora-rse');

  this.testEnv = {
    basePath: basePath,
    backendPath: backendPath,
    fixtures: path.resolve(__dirname + '/fixtures'),
    initCore(callback = () => {}) {
      rse.core.init(() => process.nextTick(callback));
    }
  };

  rse = require('linagora-rse');
  
  this.helpers = {};

  rse.test.helpers(this.helpers, this.testEnv);
  this.helpers.objectIdMock = stringId => ({
    value: () => stringId,
    equals: otherObjectId => stringId === otherObjectId.value()
  });
});

beforeEach(function() {
  mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
  const depsStore = {
    logger: require('./fixtures/logger-noop'),
    errors: require('./fixtures/errors')
  };
  const dependencies = function(name) {
    return depsStore[name];
  };

  const addDep = function(name, dep) {
    depsStore[name] = dep;
  };

  this.moduleHelpers = {
    backendPath: path.normalize(__dirname + '/../../backend'),
    addDep: addDep,
    dependencies: dependencies
  };
});

afterEach(function() {
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
