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
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
    },
  }),
});

redisClient.on("error", (err) =>
  console.error("Redis client error:", err.message),
);
redisClient.on("reconnecting", () => console.log("Redis reconnecting..."));
redisClient.on("ready", () => console.log("Redis connection restored"));

let parkingLots = {
  lotA: { filled: 0, name: "Lot A", max: 10, group: "Group A" },
  lotB: { filled: 0, name: "Lot B", max: 10, group: "Group A" },
  lotC: { filled: 0, name: "Lot C", max: 10, group: "Group B" },
  lotD: { filled: 0, name: "Lot D", max: 10, group: "Group C" },
};

async function saveState() {
  try {
    await redisClient.set("parkingLots", JSON.stringify(parkingLots));
    console.log("State saved to Redis");
  } catch (err) {
    console.error("Failed to save state to Redis:", err.message);
  }
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
  console.log("A user connected, emitting state:", parkingLots);
  socket.emit("state", parkingLots);

  socket.on("message", (msg) => console.log("Received raw message:", msg));

  socket.on("update", (data) => {
    if (parkingLots[data.lot]) {
      parkingLots[data.lot].filled = Math.min(
        parkingLots[data.lot].max,
        Math.max(0, data.filled),
      );
      io.emit("update", {
        lot: data.lot,
        filled: parkingLots[data.lot].filled,
      });
      saveState();
    }
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
      );
      io.emit("updateMax", { lot: data.lot, max: data.max });
      io.emit("update", {
        lot: data.lot,
        filled: parkingLots[data.lot].filled,
      });
      saveState();
    }
  });

  socket.on("addLot", (data) => {
    const newLotId = getNextLotId();
    const group = data && data.group ? data.group : "Group A"; // Default to Group A if no group specified
    parkingLots[newLotId] = {
      filled: 0,
      name: `Lot ${newLotId.charAt(3)}`,
      max: 10,
      group,
    };
    console.log("Adding lot:", newLotId, "to group:", group);
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

  socket.on("reorder", (reorderedLots) => {
    parkingLots = reorderedLots;
    console.log("Reordered lots:", parkingLots);
    io.emit("reorder", parkingLots);
    saveState();
  });

  socket.on("disconnect", () => console.log("A user disconnected"));
});

redisClient
  .connect()
  .then(async () => {
    console.log("Connected to Redis");
    const data = await redisClient.get("parkingLots");
    if (data) {
      parkingLots = JSON.parse(data);
      console.log("Loaded state from Redis:", parkingLots);
      io.emit("state", parkingLots);
    }
    app.use(express.static("public"));
    const port = process.env.PORT || 3000;
    server.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error("Failed to connect to Redis:", err.message);
    app.use(express.static("public"));
    const port = process.env.PORT || 3000;
    server.listen(port, () =>
      console.log(`Server running on port ${port} (without Redis)`),
    );
  });
