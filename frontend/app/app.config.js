(function(angular) {
  'use strict';

  angular.module('linagora.esn.community').config(configBlock);

  function configBlock(dynamicDirectiveServiceProvider) {
    var community = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-community', {priority: 30});

    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', community);
  }
})(angular);
