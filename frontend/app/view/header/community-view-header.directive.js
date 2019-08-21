(function(angular) {
  'use strict';

  angular.module('linagora.esn.community').directive('communityViewHeader', communityViewHeader);

  function communityViewHeader(
    $log,
    $state,
    notificationFactory,
    session,
    communityService,
    communityDeleteConfirmationModalService,
    $rootScope,
    ESN_COLLABORATION_MEMBER_EVENTS,
    communityAPI
  ) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/community/app/view/header/community-view-header.html',
      link: function($scope) {
        $scope.$watch('community', function() {
          $scope.canManage = communityService.isManager($scope.community, session.user);
          $scope.canJoin = communityService.canJoin($scope.community, session.user);
          $scope.canLeave = communityService.canLeave($scope.community, session.user);
          $scope.canRequestMembership = communityService.canRequestMembership($scope.community, session.user);
          $scope.canCancelMembership = communityService.canCancelRequestMembership($scope.community, session.user);
          $scope.actionVisible = $scope.actions && ($scope.canManage || $scope.canJoin || $scope.canLeave || $scope.canRequestMembership || $scope.canCancelMembership);
          $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.ACCEPTED, updateCount);
          $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.REMOVED, updateCount);
        });

        $scope.remove = function() {
          communityDeleteConfirmationModalService($scope.community, onRemovalConfirmation);
        };

        $scope.join = function() {
          $scope.canJoin = false;
          communityService.join($scope.community, session.user).then(function() {
            $scope.reload($scope.community);
          }, $scope.joinFailure);
        };

        $scope.leave = function() {
          $scope.canLeave = false;
          communityService.leave($scope.community, session.user).then($scope.reload, $scope.leaveFailure);
        };

        $scope.requestMembership = function() {
          $scope.canRequestMembership = false;
          communityService.requestMembership($scope.community, session.user).then($scope.requestMembershipSuccess, $scope.requestMembershipFailure);
        };

        $scope.cancelMembership = function() {
          $scope.canCancelMembership = false;
          communityService.cancelRequestMembership($scope.community, session.user).then($scope.reload, $scope.cancelRequestMembershipFailure);
        };

        function onRemovalConfirmation() {
          communityService.remove($scope.community).then(function() {
            notificationFactory.weakInfo('Success', 'The community has been removed');
            $state.go('community.list');
          }, function(err) {
            $log.error('Error while removing community', err);
            notificationFactory.weakError('Error', 'The community can not be removed');
          });
        }

        function updateCount() {
          communityAPI.get(self.community._id).then(function(response) {
            $scope.community.members_count = response.data.members_count;
          });
        }
      }
    };
  }
})(angular);
