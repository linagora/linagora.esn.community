(function() {
  'use strict';

  var MODULE_NAME = 'linagora.esn.community';
  var MODULE_DIR_NAME = '/linagora.esn.community';

  angular.module(MODULE_NAME)
    .factory('communityRestangular', communityRestangular);

  function communityRestangular(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl(MODULE_DIR_NAME + '/api');
      RestangularConfigurer.setFullResponse(true);
    });
  }
})();
