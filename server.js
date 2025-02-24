const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const redis = require("redis");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  ...(process.env.REDIS_URL && {
    socket: {
      tls: true,
      rejectUnauthorized: false,
    },
  }),
});

redisClient.on("error", (err) => {
  console.error("Redis client error:", err);
});

redisClient
  .connect()
  .then(async () => {
    console.log("Connected to Redis");

    app.use(express.static("public"));

    let parkingLots = {
      lotA: { filled: 0, name: "Lot A", max: 10 },
      lotB: { filled: 0, name: "Lot B", max: 10 },
      lotC: { filled: 0, name: "Lot C", max: 10 },
      lotD: { filled: 0, name: "Lot D", max: 10 },
    };

    const data = await redisClient.get("parkingLots");
    if (data) {
      parkingLots = JSON.parse(data);
    }

    function saveState() {
      redisClient.set("parkingLots", JSON.stringify(parkingLots));
    }

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
          parkingLots[data.lot].filled = Math.min(
            parkingLots[data.lot].max,
            Math.max(0, data.filled),
          ); // Cap at max
          io.emit("update", {
            lot: data.lot,
            filled: parkingLots[data.lot].filled,
          });
          saveState();
        }
      });

      socket.on("reset", () => {
        Object.keys(parkingLots).forEach((lot) => {
          parkingLots[lot].filled = 0; // Reset to empty (0 filled)
        });
        io.emit("reset", parkingLots);
        saveState();
      });

      socket.on("rename", (data) => {
        if (parkingLots[data.lot]) {
          parkingLots[data.lot].name = data.name;
          io.emit("rename", data);
          saveState();
        }
      });

      socket.on("updateMax", (data) => {
        if (parkingLots[data.lot]) {
          parkingLots[data.lot].max = data.max;
          parkingLots[data.lot].filled = Math.min(
            parkingLots[data.lot].filled,
            data.max,
          ); // Adjust filled if needed
          io.emit("updateMax", { lot: data.lot, max: data.max });
          io.emit("update", {
            lot: data.lot,
            filled: parkingLots[data.lot].filled,
          });
          saveState();
        }
      });

      socket.on("addLot", () => {
        const newLotId = getNextLotId();
        parkingLots[newLotId] = {
          filled: 0,
          name: `Lot ${newLotId.charAt(3)}`,
          max: 10,
        };
        io.emit("addLot", parkingLots);
        saveState();
      });

      socket.on("removeLot", (data) => {
        if (parkingLots[data.lot]) {
          delete parkingLots[data.lot];
          io.emit("removeLot", parkingLots);
          saveState();
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
  })
  .catch((err) => {
    console.error("Failed to connect to Redis:", err);
  });
