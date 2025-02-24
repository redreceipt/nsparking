const socket = io();
const lotsContainer = document.getElementById("lots");

// Render a single lot
function renderLot(lotId, name, spaces) {
  const lotDiv = document.createElement("div");
  lotDiv.className = "lot";
  lotDiv.innerHTML = `
        <h2><span id="name${lotId}">${name}</span><span class="edit-icon" onclick="editName('${lotId}')">✎</span></h2>
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

// Edit lot name
function editName(lotId) {
  const nameSpan = document.getElementById(`name${lotId}`);
  const currentName = nameSpan.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "edit-input";
  input.value = currentName;
  input.onblur = () => {
    const newName = input.value.trim() || lotId.toUpperCase();
    // Replace input with span locally first
    const newSpan = document.createElement("span");
    newSpan.id = `name${lotId}`;
    newSpan.textContent = newName;
    input.parentNode.replaceChild(newSpan, input);
    // Then send to server
    socket.emit("rename", { lot: lotId, name: newName });
  };
  input.onkeypress = (e) => {
    if (e.key === "Enter") {
      input.blur(); // Trigger blur to save
    }
  };
  nameSpan.parentNode.replaceChild(input, nameSpan);
  input.focus();
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
  const nameElement = document.getElementById(`name${data.lot}`);
  if (nameElement && nameElement.tagName !== "INPUT") {
    // Only update if not currently editing
    nameElement.textContent = data.name;
  }
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
