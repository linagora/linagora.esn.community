(function(angular) {
  'use strict';

  var MODULE_NAME = 'linagora.esn.community';

  angular.module(MODULE_NAME).run(runBlock);

    function runBlock(
      esnModuleRegistry,
      COMMUNITY_MODULE_METADATA
    ) {
      esnModuleRegistry.add(COMMUNITY_MODULE_METADATA);
    }
})(angular);
