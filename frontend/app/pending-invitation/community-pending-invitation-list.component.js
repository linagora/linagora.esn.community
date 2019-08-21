(function(angular) {
  'use strict';

  angular.module('linagora.esn.community')
    .component('esnCommunityPendingInvitationList', esnCommunityPendingInvitationList());

  function esnCommunityPendingInvitationList() {
    return {
      bindings: {
        community: '=',
        elementsPerPage: '=?',
        objectTypeFilter: '@?',
        scrollInsideContainer: '@?'
      },
      controller: 'ESNCommunityPendingInvitationListController',
      controllerAs: '$ctrl',
      templateUrl: '/community/app/pending-invitation/community-pending-invitation-list.html'
    };
  }
})(angular);
