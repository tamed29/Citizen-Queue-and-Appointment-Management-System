export function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join:service', (serviceId) => {
      socket.join(`service:${serviceId}`);
      console.log(`User ${socket.id} joined service room: ${serviceId}`);
    });

    socket.on('leave:service', (serviceId) => {
      socket.leave(`service:${serviceId}`);
      console.log(`User ${socket.id} left service room: ${serviceId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
