'use strict';

const { Server } = require('socket.io');

function initSocket(httpServer) {
  // 1. Create Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  // 2. Handle new client connections
  io.on('connection', (socket) => {
    console.log(`[+] connected: ${socket.id}`);

    // 3. Join a room
    socket.on('joinRoom', (data) => {
      if (data && typeof data.room === 'string') {
        socket.join(data.room);
      }
    });

    // 4. Leave a room
    socket.on('leaveRoom', (data) => {
      if (data && typeof data.room === 'string') {
        socket.leave(data.room);
      }
    });

    // 5. Broadcast new comments to everyone in the room
    socket.on('newComment', (data) => {
      if (
        data &&
        typeof data.room === 'string' &&
        typeof data.text === 'string'
      ) {
        io.to(data.room).emit('commentAdded', data);
      }
    });

    // 6. Handle client disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[-] disconnected: ${socket.id} (${reason})`);
    });
  });

  // 7. Return Socket.IO instance
  return io;
}

module.exports = { initSocket };