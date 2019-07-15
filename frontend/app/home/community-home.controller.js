(function() {
  'use strict';

  var MODULE_NAME = 'linagora.esn.community';

  angular.module(MODULE_NAME)
    .controller('communityHomeController', communityHomeController);

  function communityHomeController() {
    this.message = 'Community home!';
  }
})();
