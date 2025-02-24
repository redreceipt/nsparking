const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let parkingLots = {
  lotA: { spaces: 10, name: "Lot A" },
  lotB: { spaces: 10, name: "Lot B" },
  lotC: { spaces: 10, name: "Lot C" },
  lotD: { spaces: 10, name: "Lot D" },
};

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.emit("update", { lot: "lotA", spaces: parkingLots.lotA.spaces });
  socket.emit("update", { lot: "lotB", spaces: parkingLots.lotB.spaces });
  socket.emit("update", { lot: "lotC", spaces: parkingLots.lotC.spaces });
  socket.emit("update", { lot: "lotD", spaces: parkingLots.lotD.spaces });
  socket.emit("rename", { lot: "lotA", name: parkingLots.lotA.name });
  socket.emit("rename", { lot: "lotB", name: parkingLots.lotB.name });
  socket.emit("rename", { lot: "lotC", name: parkingLots.lotC.name });
  socket.emit("rename", { lot: "lotD", name: parkingLots.lotD.name });

  socket.on("update", (data) => {
    parkingLots[data.lot].spaces = data.spaces;
    io.emit("update", data);
  });

  socket.on("reset", (data) => {
    parkingLots.lotA.spaces = data.lotA;
    parkingLots.lotB.spaces = data.lotB;
    parkingLots.lotC.spaces = data.lotC;
    parkingLots.lotD.spaces = data.lotD;
    io.emit("reset", data);
  });

  socket.on("rename", (data) => {
    parkingLots[data.lot].name = data.name;
    io.emit("rename", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
