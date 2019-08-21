(function(angular) {
  'use strict';

  angular.module('linagora.esn.community').factory('communityRestangular',
    function(Restangular, httpErrorHandler) {
      return Restangular.withConfig(function(RestangularConfigurer) {
        RestangularConfigurer.setFullResponse(true);
        RestangularConfigurer.setBaseUrl('/community/api');
        RestangularConfigurer.setErrorInterceptor(function(response) {
          if (response.status === 401) {
            httpErrorHandler.redirectToLogin();
          }

          return true;
        });
      });
    });

})(angular);
