(function() {
  'use strict';

  var MODULE_NAME = 'linagora.esn.community';
  var MODULE_DIR_NAME = '/linagora.esn.community';

  angular.module(MODULE_NAME)
        .component('communitySubheader', communitySubheader());

  function communitySubheader() {
    var component = {
      templateUrl: MODULE_DIR_NAME + '/app/home/community-subheader.html'
    };

    return component;
  }

})();
