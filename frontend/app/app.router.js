(function() {
  'use strict';

  var MODULE_NAME = 'linagora.esn.community';
  var MODULE_DIR_NAME = '/linagora.esn.community';

  angular.module(MODULE_NAME)

    .config(function($stateProvider) {
      $stateProvider
        .state('example', {
          url: '/example',
          views: {
            '': {
              templateUrl: MODULE_DIR_NAME + '/app/home/community-home.html'
            },
            'sidebar@example': {
              templateUrl: MODULE_DIR_NAME + '/app/home/community-sidebar.html'
            }
          },
          deepStateRedirect: {
            default: 'example.home',
            fn: function() {
              return { state: 'example.home' };
            }
          },
          resolve: {
            isModuleActive: isModuleActive
          }
        })
        .state('example.home', {
          url: '/home',
          controller: 'communityHomeController',
          controllerAs: 'ctrl',
          views: {
            'main@example': {
              templateUrl: MODULE_DIR_NAME + '/app/home/community-main.html'
            }
          }
        });

        function isModuleActive($location, communityConfiguration) {
          return communityConfiguration.get('enabled', true).then(function(isEnabled) {
            if (!isEnabled) {
              $location.path('/');
            }
          }).catch(function() {
            $location.path('/');
          });
        }
    });
})();
