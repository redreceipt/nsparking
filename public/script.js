const socket = io();
const lotsContainer = document.getElementById("lots");

// Render a single lot
function renderLot(lotId, name, spaces) {
  const lotDiv = document.createElement("div");
  lotDiv.className = "lot";
  lotDiv.innerHTML = `
        <h2><span id="name${lotId}">${name}</span></h2>
        <input type="text" id="rename${lotId}" placeholder="Rename ${name}">
        <button onclick="renameLot('${lotId}')">Rename</button>
        <p>Empty Spaces: <span id="${lotId}">${spaces}</span></p>
        <button onclick="updateSpaces('${lotId}', 1)">+</button>
        <button onclick="updateSpaces('${lotId}', -1)">-</button>
        <input type="number" id="set${lotId}" min="0" placeholder="Set spaces">
        <button onclick="setSpaces('${lotId}')">Set</button>
        <button onclick="removeLot('${lotId}')">Remove</button>
    `;
  lotsContainer.appendChild(lotDiv);
}

// Clear and re-render all lots
function renderLots(lots) {
  lotsContainer.innerHTML = "";
  Object.keys(lots).forEach((lotId) => {
    renderLot(lotId, lots[lotId].name, lots[lotId].spaces);
  });
}

// Increment or decrement spaces
function updateSpaces(lotId, change) {
  const currentSpaces = parseInt(document.getElementById(lotId).textContent);
  const newSpaces = Math.max(0, currentSpaces + change);
  socket.emit("update", { lot: lotId, spaces: newSpaces });
}

// Set spaces manually
function setSpaces(lotId) {
  const input = document.getElementById(`set${lotId}`);
  const newSpaces = Math.max(0, parseInt(input.value) || 0);
  socket.emit("update", { lot: lotId, spaces: newSpaces });
  input.value = "";
}

// Reset all to max
function resetAll() {
  socket.emit("reset");
}

// Rename a lot
function renameLot(lotId) {
  const input = document.getElementById(`rename${lotId}`);
  const newName = input.value.trim() || lotId.toUpperCase();
  socket.emit("rename", { lot: lotId, name: newName });
  input.value = "";
}

// Add a new lot
function addLot() {
  socket.emit("addLot");
}

// Remove a lot
function removeLot(lotId) {
  socket.emit("removeLot", { lot: lotId });
}

// Handle initial state and updates from server
socket.on("state", (lots) => {
  renderLots(lots);
});

socket.on("update", (data) => {
  document.getElementById(data.lot).textContent = data.spaces;
});

socket.on("rename", (data) => {
  document.getElementById(`name${data.lot}`).textContent = data.name;
});

socket.on("addLot", (lots) => {
  renderLots(lots);
});

socket.on("removeLot", (lots) => {
  renderLots(lots);
});

socket.on("reset", (lots) => {
  renderLots(lots);
});
