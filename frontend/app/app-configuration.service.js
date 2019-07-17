(function(angular) {
  'use strict';

  var MODULE_NAME = 'linagora.esn.community';

  angular.module(MODULE_NAME).factory('communityConfiguration', communityConfiguration);

  function communityConfiguration(esnConfig) {

    return {
      get: get
    };

    function get(key, defaultValue) {
      return esnConfig('core.modules.' + MODULE_NAME + '.' + key, defaultValue);
    }
  }
})(angular);
