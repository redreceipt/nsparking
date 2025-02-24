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

function getNextLotId() {
  const existingIds = Object.keys(parkingLots);
  let nextChar = "A";
  while (existingIds.includes(`lot${nextChar}`)) {
    nextChar = String.fromCharCode(nextChar.charCodeAt(0) + 1);
  }
  return `lot${nextChar}`;
}

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.emit("state", parkingLots);

  socket.on("update", (data) => {
    if (parkingLots[data.lot]) {
      parkingLots[data.lot].spaces = data.spaces;
      io.emit("update", data);
    }
  });

  socket.on("reset", () => {
    Object.keys(parkingLots).forEach((lot) => {
      parkingLots[lot].spaces = 10; // Default max
    });
    io.emit("reset", parkingLots);
  });

  socket.on("rename", (data) => {
    if (parkingLots[data.lot]) {
      parkingLots[data.lot].name = data.name;
      io.emit("rename", data);
    }
  });

  socket.on("addLot", () => {
    const newLotId = getNextLotId();
    parkingLots[newLotId] = { spaces: 10, name: `Lot ${newLotId.charAt(3)}` };
    io.emit("addLot", parkingLots);
  });

  socket.on("removeLot", (data) => {
    if (parkingLots[data.lot]) {
      delete parkingLots[data.lot];
      io.emit("removeLot", parkingLots);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
