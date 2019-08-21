(function(angular) {
  'use strict';

  angular.module('linagora.esn.community').component('communityAbout', {
    bindings: {
      community: '='
    },
    controller: 'communityAboutController',
    templateUrl: '/community/app/about/community-about.html'
  });
})(angular);
