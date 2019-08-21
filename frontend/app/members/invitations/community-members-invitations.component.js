(function(angular) {
  'use strict';

  angular.module('linagora.esn.community').component('communityMembersInvitations', {
    bindings: {
      community: '='
    },
    controller: 'CommunityMembersInvitationsController',
    templateUrl: '/community/app/members/invitations/community-members-invitations.html'
  });

})(angular);
