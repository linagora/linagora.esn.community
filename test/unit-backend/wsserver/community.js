const { expect } = require('chai');

describe('The community notification WS module', function() {
  const JOIN_TOPIC = 'community:join';
  const LEAVE_TOPIC = 'community:leave';
  let getModule, ioHelperMock;

  describe('init function', function() {
    beforeEach(function() {
      const self = this;

      ioHelperMock = {
        getUserSocketsFromNamespace: () => {}
      };

      this.moduleHelpers.addDep('logger', this.helpers.requireFixture('logger-noop'));
      this.moduleHelpers.addDep('pubsub', {
        global: {
          topic: function(topic) {
            return {
              subscribe: function(callback) {
                if (topic === JOIN_TOPIC) {
                  self.join_callback = callback;
                } else if (topic === LEAVE_TOPIC) {
                  self.leave_callback = callback;
                }
              }
            };
          }
        }
      });
      this.moduleHelpers.addDep('wsserver', {
        io: {
          of: function() {
            return {
              on: function() {}
            };
          }
        },
        ioHelper: ioHelperMock
      });
      getModule = () => require('../../../backend/wsserver')(this.moduleHelpers.dependencies);
    });

    it('should register pubsub subscriber for community:join event', function() {
      getModule().init();
      expect(this.join_callback).to.be.a('function');
    });

    it('should register pubsub subscriber for community:leave event', function() {
      getModule().init();
      expect(this.leave_callback).to.be.a('function');
    });

    describe('community:join subscriber', function() {
      beforeEach(function() {
        getModule().init();
      });

      it('should return the message from the pubsub', function(done) {
        ioHelperMock.getUserSocketsFromNamespace = function() {
          const socket = {
            emit: function(event, msg) {
              expect(event).to.equal('join');
              expect(msg.author).to.equal('1234');
              expect(msg.target).to.equal('5678');
              expect(msg.community).to.equal('9876');
              done();
            }
          };

          return [socket];
        };

        this.join_callback({
          author: '1234',
          target: '5678',
          community: '9876'
        });
      });
    });
    describe('community:leave subscriber', function() {
      beforeEach(function() {
        getModule().init();
      });

      it('should return the message from the pubsub', function(done) {
        ioHelperMock.getUserSocketsFromNamespace = function() {
          const socket = {
            emit: function(event, msg) {
              expect(event).to.equal('leave');
              expect(msg.author).to.equal('1234');
              expect(msg.target).to.equal('5678');
              expect(msg.community).to.equal('9876');
              done();
            }
          };

          return [socket];
        };

        this.leave_callback({
          author: '1234',
          target: '5678',
          community: '9876'
        });
      });
    });
  });
});
