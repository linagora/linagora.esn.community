(function(angular) {
  'use strict';

  angular.module('linagora.esn.community')
    .component('esnCommunityPendingInvitationDisplay', esnCommunityPendingInvitationDisplay());

  function esnCommunityPendingInvitationDisplay() {
    return {
      bindings: {
        request: '=',
        community: '='
      },
      controller: 'ESNCommunityPendingInvitationDisplayController',
      controllerAs: '$ctrl',
      templateUrl: '/community/app/pending-invitation/community-pending-invitation-display.html'
    };
  }

})(angular);
