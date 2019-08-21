(function(angular) {
  'use strict';

  angular.module('linagora.esn.community').run(runBlock);

  function runBlock(
    objectTypeResolver,
    objectTypeAdapter,
    communityAPI,
    communityAdapterService,
    communityRestangular,
    communityConfiguration,
    ASTrackerSubscriptionService,
    esnCollaborationRegistry,
    esnMessageRegistry,
    communityService
  ) {
    communityConfiguration.get('enable', true).then(function(isEnabled) {
      if (!isEnabled) {
        return;
      }

      objectTypeResolver.register('community', communityAPI.get);
      objectTypeAdapter.register('community', communityAdapterService);
      communityRestangular.extendModel('communities', function(model) {
        return communityAdapterService(model);
      });
      ASTrackerSubscriptionService.register('community', { get: communityAPI.get });
      esnCollaborationRegistry.add({
        objectType: 'community',
        member: {
          isManager: communityService.isManager
        }
      });
      esnMessageRegistry.add({
        objectType: 'community',
        message: {
          canRemove: communityService.canRemoveMessage
        }
      });
    });
  }
})(angular);
