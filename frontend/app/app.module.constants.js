(function() {
  'use strict';

  var MODULE_NAME = 'linagora.esn.community';

  angular.module(MODULE_NAME)
    .constant('COMMUNITY_MODULE_METADATA', {
      id: 'linagora.esn.community',
      title: 'Community',
      icon: '/linagora.esn.community/images/communities-icon.svg',
      homePage: 'Community',
      disableable: true,
      isDisplayedByDefault: true
    });
})();
