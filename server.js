const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from 'public' folder
app.use(express.static("public"));

// Parking lot data
let parkingLots = {
  lotA: 10,
  lotB: 10,
  lotC: 10,
  lotD: 10,
};

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.emit("update", { lot: "lotA", spaces: parkingLots.lotA });
  socket.emit("update", { lot: "lotB", spaces: parkingLots.lotB });
  socket.emit("update", { lot: "lotC", spaces: parkingLots.lotC });
  socket.emit("update", { lot: "lotD", spaces: parkingLots.lotD });

  socket.on("update", (data) => {
    parkingLots[data.lot] = data.spaces;
    io.emit("update", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server on dynamic port
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
