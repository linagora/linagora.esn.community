(function(angular) {
  'use strict';

  angular.module('linagora.esn.community').controller('CommunityMembersInvitationsController', CommunityMembersInvitationsController);

  function CommunityMembersInvitationsController(communityService, session) {
    var self = this;

    self.isCommunityManager = isCommunityManager;

    function isCommunityManager() {
      return communityService.isManager(self.community, session.user);
    }
  }
})(angular);
