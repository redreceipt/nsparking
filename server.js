const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let parkingLots = {
  lotA: { spaces: 10, name: "Lot A", max: 10 },
  lotB: { spaces: 10, name: "Lot B", max: 10 },
  lotC: { spaces: 10, name: "Lot C", max: 10 },
  lotD: { spaces: 10, name: "Lot D", max: 10 },
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
      parkingLots[data.lot].spaces = Math.min(
        parkingLots[data.lot].max,
        Math.max(0, data.spaces),
      ); // Cap at max
      io.emit("update", {
        lot: data.lot,
        spaces: parkingLots[data.lot].spaces,
      });
    }
  });

  socket.on("reset", () => {
    Object.keys(parkingLots).forEach((lot) => {
      parkingLots[lot].spaces = parkingLots[lot].max;
    });
    io.emit("reset", parkingLots);
  });

  socket.on("rename", (data) => {
    if (parkingLots[data.lot]) {
      parkingLots[data.lot].name = data.name;
      io.emit("rename", data);
    }
  });

  socket.on("updateMax", (data) => {
    if (parkingLots[data.lot]) {
      parkingLots[data.lot].max = data.max;
      parkingLots[data.lot].spaces = Math.min(
        parkingLots[data.lot].spaces,
        data.max,
      ); // Adjust spaces if needed
      io.emit("updateMax", { lot: data.lot, max: data.max });
      io.emit("update", {
        lot: data.lot,
        spaces: parkingLots[data.lot].spaces,
      });
    }
  });

  socket.on("addLot", () => {
    const newLotId = getNextLotId();
    parkingLots[newLotId] = {
      spaces: 10,
      name: `Lot ${newLotId.charAt(3)}`,
      max: 10,
    };
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
