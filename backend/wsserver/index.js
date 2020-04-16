let initialized = false;

const NAMESPACE = '/community';
const JOIN_EVENT = 'join';
const LEAVE_EVENT = 'leave';
const JOIN_TOPIC = 'community:join';
const LEAVE_TOPIC = 'community:leave';

module.exports = dependencies => {
  const pubsub = dependencies('pubsub').global;
  const logger = dependencies('logger');
  const {
    io,
    ioHelper
  } = dependencies('wsserver');

  return {
    init
  };

  function notifyRoom(event, msg) {
    const clientSockets = ioHelper.getUserSocketsFromNamespace(msg.target, io.of(NAMESPACE).sockets);

    if (!clientSockets) {
      return;
    }

    clientSockets.forEach(function(socket) {
      socket.emit(event, msg);
    });
  }

  function init() {
    if (initialized) {
      logger.warn('The notification community service is already initialized');

      return;
    }

    pubsub.topic(JOIN_TOPIC).subscribe(function(msg) {
      notifyRoom(JOIN_EVENT, msg);
    });

    pubsub.topic(LEAVE_TOPIC).subscribe(function(msg) {
      notifyRoom(LEAVE_EVENT, msg);
    });

    io.of(NAMESPACE)
      .on('connection', function(socket) {
        var userId = ioHelper.getUserId(socket);

        logger.info('User', userId, ': new connection on ' + NAMESPACE);

        socket.on('subscribe', function(uuid) {
          logger.info('User', userId, ': joining room ', NAMESPACE, '/', uuid);
          socket.join(uuid);
        });

        socket.on('unsubscribe', function(uuid) {
          logger.info('User', userId, ': leaving room ', NAMESPACE, '/', uuid);
          socket.leave(uuid);
        });
      });

    initialized = true;
  }
};
