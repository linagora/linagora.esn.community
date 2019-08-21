(function(angular) {
  'use strict';

  angular.module('linagora.esn.community').component('esnCommunityMembersTabs', {
    bindings: {
      community: '='
    },
    controller: 'ESNCommunityMembersTabsController',
    templateUrl: '/community/app/members/tabs/community-members-tabs.html'
  });

})(angular);
