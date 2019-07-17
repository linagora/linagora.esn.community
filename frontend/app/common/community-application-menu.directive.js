(function() {
  'use strict';

  var MODULE_NAME = 'linagora.esn.community';

  angular.module(MODULE_NAME)
        .directive('communityApplicationMenu', communityApplicationMenu);

  function communityApplicationMenu(applicationMenuTemplateBuilder, COMMUNITY_MODULE_METADATA) {
    var directive = {
      restrict: 'E',
      template: applicationMenuTemplateBuilder('/#/example', '/images/application-menu/communities-icon.svg', 'Community', 'core.modules.linagora.esn.community.enabled', COMMUNITY_MODULE_METADATA.isDisplayedByDefault),
      replace: true
    };

    return directive;
  }
})();
