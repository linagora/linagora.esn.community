(function(angular) {
  'use strict';

  angular.module('linagora.esn.community').component('esnCommunityMembersInvitations', {
    bindings: {
      community: '='
    },
    controller: 'ESNCommunityMembersInvitationsController',
    templateUrl: '/community/app/members/invitations/community-members-invitations.html'
  });

})(angular);
