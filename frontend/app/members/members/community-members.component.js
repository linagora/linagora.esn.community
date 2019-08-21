(function(angular) {
  'use strict';

  angular.module('linagora.esn.community').component('esnCommunityMembers', {
    bindings: {
      community: '='
    },
    controller: 'ESNCommunityMembersController',
    templateUrl: '/community/app/members/members/community-members.html'
  });

})(angular);
