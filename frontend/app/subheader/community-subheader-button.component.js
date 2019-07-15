'use strict';

var MODULE_NAME = 'linagora.esn.community';
var MODULE_DIR_NAME = '/linagora.esn.community';

angular.module(MODULE_NAME)

  .component('communitySubheaderButton', {
    templateUrl: MODULE_DIR_NAME + '/app/subheader/community-subheader-button.html',
    bindings: {
      communityDisabled: '<?',
      communityClick: '&?',
      communityIconClass: '@?',
      communityIconText: '@?',
      communityIconPosition: '@?'
    },
    controllerAs: 'ctrl'
  });
