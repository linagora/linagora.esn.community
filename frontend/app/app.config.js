(function() {
  'use strict';

  var MODULE_NAME = 'linagora.esn.community';

  angular.module(MODULE_NAME)
    .config(communityApplicationMenu);

  function communityApplicationMenu(dynamicDirectiveServiceProvider) {
    var home = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'community-application-menu');

    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', home);
  }
})();
