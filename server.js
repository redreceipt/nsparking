const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // Serve HTML, CSS, JS files from 'public' folder

// Initial parking lot data
let parkingLots = {
  lotA: 10,
  lotB: 10,
  lotC: 10,
  lotD: 10,
};

io.on("connection", (socket) => {
  console.log("A user connected");
  // Send current state to new user
  socket.emit("update", { lot: "lotA", spaces: parkingLots.lotA });
  socket.emit("update", { lot: "lotB", spaces: parkingLots.lotB });
  socket.emit("update", { lot: "lotC", spaces: parkingLots.lotC });
  socket.emit("update", { lot: "lotD", spaces: parkingLots.lotD });

  socket.on("update", (data) => {
    parkingLots[data.lot] = data.spaces; // Update server state
    io.emit("update", data); // Broadcast to all clients
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
