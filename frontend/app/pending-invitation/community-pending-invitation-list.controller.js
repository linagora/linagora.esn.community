(function(angular) {
  'use strict';

  angular.module('linagora.esn.community')
    .controller('ESNCommunityPendingInvitationListController', ESNCommunityPendingInvitationListController);

  function ESNCommunityPendingInvitationListController(
    $rootScope,
    esnCollaborationClientService,
    esnCollaborationMembershipRequestsPaginationProvider,
    infiniteScrollHelper,
    PageAggregatorService,
    ESN_COLLABORATION_MEMBER_EVENTS,
    ELEMENTS_PER_PAGE,
    _
    ) {
    var self = this;
    var aggregator;
    var results_per_page = self.elementsPerPage || ELEMENTS_PER_PAGE;
    var options = {
      offset: 0,
      limit: results_per_page,
      workflow: 'invitation'
    };

    self.error = false;
    self.updatePendingRequestsList = updatePendingRequestsList;
    self.onInvitationCanceled = onInvitationCanceled;
    self.$onInit = $onInit;
    self.$onDestroy = $onDestroy;

    function $onInit() {
      self.unregisterDeclined = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.USERS, self.updatePendingRequestsList);
      self.unregisterCanceled = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.CANCEL, self.onInvitationCanceled);
    }

    function $onDestroy() {
      self.unregisterDeclined();
      self.unregisterCanceled();
    }

    self.loadMoreElements = infiniteScrollHelper(self, function() {
      if (aggregator) {
        return load();
      }

      var provider = new esnCollaborationMembershipRequestsPaginationProvider({
        id: self.community.id || self.community._id,
        objectType: self.community.objectType
      }, options);

      aggregator = new PageAggregatorService('CollaborationPendingInvitationsAggregator', [provider], {
        compare: function(a, b) { return b.metadata.timestamps.creation - a.metadata.timestamps.creation; },
        results_per_page: results_per_page
      });

      return load();
    });

    function load() {
      return aggregator.loadNextItems().then(_.property('data'), _.constant([]));
    }

    function updatePendingRequestsList() {
      esnCollaborationClientService.getRequestMemberships('community', self.community._id, {}).then(function(response) {
        self.elements = response.data;
      }, function(err) {
        self.error = err.status;
      });
    }

    function onInvitationCanceled() {
      self.updatePendingRequestsList();
    }
  }

})(angular);
