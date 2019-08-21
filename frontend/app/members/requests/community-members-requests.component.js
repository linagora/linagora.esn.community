(function(angular) {
  'use strict';

  angular.module('linagora.esn.community').component('esnCommunityMembersRequests', {
    bindings: {
      community: '='
    },
    controller: 'ESNCommunityMembersRequestsController',
    templateUrl: '/community/app/members/requests/community-members-requests.html'
  });

})(angular);
