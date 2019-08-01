const { expect } = require('chai');
const sinon = require('sinon');

describe('The community denormalize module', function() {
  let getModule;
  let communityMock;

  beforeEach(function() {
    communityMock = function(community) {
      this._id = community._id;

      return this;
    };

    const modelsMock = {
      Community: communityMock
    };

    const db = {
      mongo: {
        mongoose: {
          model: function(type) {
            return modelsMock[type];
          }
        }
      }
    };

    this.moduleHelpers.addDep('db', db);

    getModule = () => require(`${this.moduleHelpers.backendPath}/lib/core/denormalize`)(this.moduleHelpers.dependencies);
  });

  describe('The denormalize function', function() {
    let toObjectMock;
    let convertedObject;

    beforeEach(function() {
      convertedObject = { foo: 'bar' };
      toObjectMock = sinon.stub().returns(convertedObject);
      communityMock.prototype.toObject = toObjectMock;
    });

    it('should set the document.id and remove _id', function() {
      const community = { _id: 1 };
      const document = getModule().denormalize(community);

      expect(document).to.deep.equal(convertedObject);
      expect(toObjectMock).to.have.been.calledOnce;
      expect(toObjectMock).to.have.been.calledWith({
        virtuals: true,
        transform: sinon.match.func
      });
    });
  });

  describe('The getId function', function() {
    it('should return the _id', function() {
      const community = { _id: 1 };

      expect(getModule().getId(community)).to.equal(community._id);
    });
  });
});
