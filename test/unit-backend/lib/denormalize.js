const { expect } = require('chai');

describe('The community denormalize module', function() {
  beforeEach(function() {
    this.moduleHelpers.addDep('db', {
      mongo: {
        mongoose: {
          model: () => function(community) {
            return {
              toObject: () => community
            };
          }
        }
      }
    });
  });

  describe('The denormalize function', function() {
    it('should return denormalized document', function() {
      const denormalizer = require('../../../backend/lib/denormalize')(this.moduleHelpers.dependencies);
      const community = { _id: '123' };
      const denormalizedCommunity = denormalizer.denormalize(community);

      expect(denormalizedCommunity).to.deep.equal(community);
    });
  });

  describe('The getId function', function() {
    it('should return the _id', function() {
      const community = {_id: 1};

      expect(require('../../../backend/lib/denormalize')(this.moduleHelpers.dependencies).getId(community)).to.equal(community._id);
    });
  });
});
