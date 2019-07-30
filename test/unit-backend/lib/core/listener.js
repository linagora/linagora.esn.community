const mockery = require('mockery');
const { expect } = require('chai');

describe('The community listener module', function() {

  describe('The register function', function() {

    it('should add a listener into ES', function() {
      const elasticsearchMock = {
        listeners: {
          addListener: function(options) {
            expect(options.events.add).to.exist;
            expect(options.events.update).to.exist;
            expect(options.events.remove).to.exist;
            expect(options.denormalize).to.be.a.function;
            expect(options.type).to.exist;
            expect(options.index).to.exist;
          }
        }
      };

      mockery.registerMock('./denormalize', function() {});
      this.moduleHelpers.addDep('elasticsearch', elasticsearchMock);
      require(`${this.moduleHelpers.backendPath}/lib/core/listener`)(this.moduleHelpers.dependencies);
    });
  });
});
