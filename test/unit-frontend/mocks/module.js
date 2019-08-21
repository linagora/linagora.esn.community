'use strict';

angular.module('esn.form.helper', []);
angular.module('pascalprecht.translate', []);
angular.module('esn.registry', [])
  .provider('esnRegistry', function() {
    return {
      $get: angular.noop
    };
  });
angular.module('esn.module-registry', ['esn.registry'])
  .factory('esnModuleRegistry', function() {
    return {
      add: angular.noop
    };
  });
angular.module('esn.router', ['ui.router'])
  .factory('session', function($q) {
    return {
      ready: $q.when(),
      user: {},
      domain: {},
      userIsDomainAdministrator: function() {
        return false;
      }
    };
  });
angular.module('esn.i18n', [])
  .filter('esnI18n', function() {
    return function(input) { return input; };
  })
  .factory('esnI18nService', function() {
    return {
      translate: function() { }
    };
  });
angular.module('esn.session', []);
angular.module('esn.header', []);
angular.module('esn.subheader', []);
angular.module('esn.avatar', []);

angular.module('mgcrea.ngStrap.alert', []);
angular.module('mgcrea.ngStrap.tooltip', []);
angular.module('esn.infinite-list', []);
angular.module('openpaas-logo', []);
angular.module('ngTagsInput', []);
angular.module('esn.widget.helper', []);
angular.module('esn.collaboration', [])
  .factory('esnCollaborationRegistry', function() {
    return {};
  })
  .factory('esnCollaborationClientService', function() {
    return {};
  });
angular.module('esn.message', [])
  .factory('esnMessageRegistry', function() {
    return {};
  })
  .factory('esnMessageHelpers', function() {
    return function() { };
  });
angular.module('esn.feature-registry', []);
angular.module('esn.configuration', ['esn.session', 'feature-flags'])
  .factory('esnConfig', function() {
    return function() {
      return $q.when();
    };
  })
  .factory('esnConfigApi', function() {
    return {};
  });
angular.module('esn.core', [])
  .constant('routeResolver', {
    session: function(key) {
      return ['$q', function($q) {
        var session = {
          user: {
            _id: 'id'
          },
          domain: 'domain'
        };

        return $q.when(session[key]);
      }];
    },
    api: function(api, method, paramName, target) {
      return [api, '$stateParams', '$location', function(api, $stateParams, $location) {
        var routeId = $stateParams[paramName || 'id'] || undefined;

        return api[method || 'get'](routeId).then(function(response) {
          return response.data;
        }, function() {
          $location.path(target || '/');
        });
      }];
    }
  });

