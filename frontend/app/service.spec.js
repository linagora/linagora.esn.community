'use strict';

describe('getCommunities function', function() {

  beforeEach(function() {
    module('linagora.esn.community');

    inject(function(communityAPI, $httpBackend) {
      this.communityAPI = communityAPI;
      this.$httpBackend = $httpBackend;
    });
  });

  it('should send a GET to /community/api/user/communities', function() {
    this.$httpBackend.expectGET('/community/api/user/communities').respond(200, []);
    this.communityAPI.getCommunities();
    this.$httpBackend.flush();
  });
});
