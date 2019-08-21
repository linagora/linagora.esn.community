'use strict';

module.exports = function(config) {
  config.set({
    basePath: '../../',
    files: [
      'frontend/components/chai/chai.js',
      'node_modules/chai-shallow-deep-equal/chai-shallow-deep-equal.js',
      'frontend/components/jquery/dist/jquery.min.js',
      'frontend/components/angular/angular.js',
      'frontend/components/moment/moment.js',
      'frontend/components/angular-moment/angular-moment.js',
      'frontend/components/angular-cookies/angular-cookies.min.js',
      'frontend/components/localforage/dist/localforage.min.js',
      'frontend/components/angular-localforage/dist/angular-localForage.js',
      'frontend/components/angular-strap/dist/angular-strap.js',
      'frontend/components/angular-strap/dist/angular-strap.tpl.js',
      'frontend/components/angular-ui-router/release/angular-ui-router.min.js',
      'frontend/components/angular-mocks/angular-mocks.js',
      'frontend/components/dynamic-directive/dist/dynamic-directive.min.js',
      'frontend/components/angular-component/dist/angular-component.min.js',
      'frontend/components/restangular/dist/restangular.min.js',
      'frontend/components/restangular/dist/restangular.js',
      'frontend/components/lodash/dist/lodash.min.js',
      'frontend/components/sinon-chai/lib/sinon-chai.js',
      'frontend/components/angular-animate/angular-animate.js',
      'frontend/components/angular-file-upload/dist/angular-file-upload-all.js',
      'frontend/components/angular-feature-flags/dist/featureFlags.js',
      'node_modules/sinon/pkg/sinon.js',

      'node_modules/linagora-rse/frontend/js/modules/**/*.module.js',
      'node_modules/linagora-rse/frontend/js/modules/**/*.js',
      'node_modules/linagora-rse/frontend/js/*.js',
      'node_modules/linagora-rse/test/fixtures/**/*.js',
      'node_modules/linagora-rse/frontend/views/modules/**/*.pug',

      { pattern: 'node_modules/linagora-rse/frontend/js/modules/i18n/i18n.run.js', watched: false, included: false, served: true },
      { pattern: 'node_modules/linagora-rse/frontend/js/modules/i18n/i18n.config.js', watched: false, included: false, served: true },
      { pattern: 'node_modules/linagora-rse/frontend/js/modules/header/*.run.js', watched: false, included: false, served: true },

      'test/unit-frontend/mocks/**/*.js',
      'frontend/app/**/*.module.js',
      'frontend/app/**/*.js',
      'frontend/app/**/*.pug',
      'frontend/views/**/*.pug'
    ],
    exclude: [
      'node_modules/linagora-rse/frontend/js/**/*.spec.js',
      'node_modules/linagora-rse/frontend/js/**/*.run.js',
      'frontend/app/app.config.js'
    ],
    frameworks: ['mocha'],
    colors: true,
    singleRun: true,
    autoWatch: true,
    browsers: ['PhantomJS', 'Chrome', 'Firefox'],
    reporters: ['coverage', 'spec'],
    preprocessors: {
      'frontend/app/**/*.js': ['coverage'],
      '**/*.pug': ['ng-jade2module']
    },

    plugins: [
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-coverage',
      'karma-spec-reporter',
      '@linagora/karma-ng-jade2module-preprocessor'
    ],

    coverageReporter: { type: 'text', dir: '/tmp' },

    ngJade2ModulePreprocessor: {
      stripPrefix: 'frontend',
      prependPrefix: '/linagora.esn.community',
      cacheIdFromPath: function(filepath) {
        return filepath
          .replace(/pug$/, 'html')
          .replace(/^frontend/, '/community')
          .replace(/^node_modules\/linagora-rse\/frontend/, '');
      },
      // setting this option will create only a single module that contains templates
      // from all the files, so you can load them all with module('templates')
      jadeRenderOptions: {
        basedir: require('path').resolve(__dirname, '../../node_modules/linagora-rse/frontend/views')
      },
      jadeRenderLocals: {
        __: function(str, ...params) {
          return str.replace(/(%s)/g, function() {
            return params.shift();
          });
        }
      },
      moduleName: 'jadeTemplates'
    }

  });
};
