const socket = io();

// Increment or decrement spaces
function updateSpaces(lotId, change) {
  const currentSpaces = parseInt(document.getElementById(lotId).textContent);
  const newSpaces = Math.max(0, currentSpaces + change);
  socket.emit("update", { lot: lotId, spaces: newSpaces });
}

// Set spaces manually
function setSpaces(lotId) {
  const input = document.getElementById(
    `set${lotId.charAt(0).toUpperCase() + lotId.slice(1)}`,
  );
  const newSpaces = Math.max(0, parseInt(input.value) || 0);
  socket.emit("update", { lot: lotId, spaces: newSpaces });
  input.value = "";
}

// Reset all to max
function resetAll() {
  const maxSpaces = 10; // Adjust as needed
  socket.emit("reset", {
    lotA: maxSpaces,
    lotB: maxSpaces,
    lotC: maxSpaces,
    lotD: maxSpaces,
  });
}

// Rename a lot
function renameLot(lotId) {
  const input = document.getElementById(
    `rename${lotId.charAt(0).toUpperCase() + lotId.slice(1)}`,
  );
  const newName = input.value.trim() || lotId.toUpperCase(); // Default to lotId if empty
  socket.emit("rename", { lot: lotId, name: newName });
  input.value = ""; // Clear input after renaming
}

// Handle space updates
socket.on("update", (data) => {
  document.getElementById(data.lot).textContent = data.spaces;
});

// Handle reset
socket.on("reset", (data) => {
  document.getElementById("lotA").textContent = data.lotA;
  document.getElementById("lotB").textContent = data.lotB;
  document.getElementById("lotC").textContent = data.lotC;
  document.getElementById("lotD").textContent = data.lotD;
});

// Handle name updates
socket.on("rename", (data) => {
  document.getElementById(
    `name${data.lot.charAt(0).toUpperCase() + data.lot.slice(1)}`,
  ).textContent = data.name;
});
