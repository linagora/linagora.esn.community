(function(angular) {
  'use strict';

  angular.module('linagora.esn.community')
    .factory('communityConfiguration', communityConfiguration);

  function communityConfiguration(esnConfig) {
    return {
      get: get
    };

    function get(key, defaultValue) {
      return esnConfig('core.modules.linagora.esn.community.' + key, defaultValue);
    }
  }
})(angular);
