const socket = io();
console.log("Socket initialized");
const lotsContainer = document.getElementById("lots");
const fullPercentageSpan = document.getElementById("full-percentage");
console.log("DOM elements loaded:", lotsContainer, fullPercentageSpan);

// Render a single lot
function renderLot(lotId, name, filled, max) {
  console.log(`Rendering lot ${lotId}: ${name}, ${filled}/${max}`);
  const lotDiv = document.createElement("div");
  lotDiv.className = "lot";
  lotDiv.innerHTML = `
        <div class="name-container">
            <h2><span id="name${lotId}">${name}</span><span class="edit-icon" id="editNameIcon${lotId}" onclick="editName('${lotId}')">✎</span></h2>
        </div>
        <div class="max-container">
            <p>Max Capacity: <span id="max${lotId}">${max}</span><span class="edit-icon" id="editMaxIcon${lotId}" onclick="editMax('${lotId}')">✎</span></p>
        </div>
        <div class="spaces-container">
            <p class="filled-spaces">Filled Spaces: <span id="${lotId}">${filled}</span><span class="edit-icon" id="editSpacesIcon${lotId}" onclick="editSpaces('${lotId}')">✎</span></p>
        </div>
        <div class="button-group">
            <button onclick="updateSpaces('${lotId}', 1)">+</button>
            <button onclick="updateSpaces('${lotId}', -1)">-</button>
        </div>
        <div class="shortcut-buttons">
            <button class="shortcut-button" onclick="setFull('${lotId}')">Full</button>
            <button class="shortcut-button" onclick="setEmpty('${lotId}')">Empty</button>
        </div>
        <button class="remove-button" onclick="removeLot('${lotId}')">Remove</button>
    `;
  lotsContainer.appendChild(lotDiv);
}

// Clear and re-render all lots
function renderLots(lots) {
  console.log("Rendering lots:", lots);
  lotsContainer.innerHTML = "";
  Object.keys(lots).forEach((lotId) => {
    renderLot(lotId, lots[lotId].name, lots[lotId].filled, lots[lotId].max);
  });
  updateFullPercentage(lots);
}

// Update full lot percentage
function updateFullPercentage(lots) {
  const totalMax = Object.values(lots).reduce((sum, lot) => sum + lot.max, 0);
  const totalFilled = Object.values(lots).reduce(
    (sum, lot) => sum + lot.filled,
    0,
  );
  const percentage =
    totalMax > 0 ? Math.round((totalFilled / totalMax) * 100) : 0;
  fullPercentageSpan.textContent = `${percentage}%`;
}

// Edit lot name
function editName(lotId) {
  const nameSpan = document.getElementById(`name${lotId}`);
  const editIcon = document.getElementById(`editNameIcon${lotId}`);
  const currentName = nameSpan.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "edit-input";
  input.value = currentName;
  input.onblur = () => {
    const newName = input.value.trim() || lotId.toUpperCase();
    const newSpan = document.createElement("span");
    newSpan.id = `name${lotId}`;
    newSpan.textContent = newName;
    input.parentNode.replaceChild(newSpan, input);
    editIcon.style.display = "inline";
    socket.emit("rename", { lot: lotId, name: newName });
  };
  input.onkeypress = (e) => {
    if (e.key === "Enter") input.blur();
  };
  nameSpan.parentNode.replaceChild(input, nameSpan);
  editIcon.style.display = "none";
  input.focus();
}

// Edit lot spaces (filled spaces)
function editSpaces(lotId) {
  const filledSpan = document.getElementById(lotId);
  const maxSpan = document.getElementById(`max${lotId}`);
  const editIcon = document.getElementById(`editSpacesIcon${lotId}`);
  const currentFilled = parseInt(filledSpan.textContent);
  const maxCapacity = parseInt(maxSpan.textContent);
  const input = document.createElement("input");
  input.type = "number";
  input.className = "edit-input-number";
  input.value = currentFilled;
  input.min = "0";
  input.max = maxCapacity;
  input.onblur = () => {
    const newFilled = Math.min(
      maxCapacity,
      Math.max(0, parseInt(input.value) || 0),
    );
    const newSpan = document.createElement("span");
    newSpan.id = lotId;
    newSpan.textContent = newFilled;
    input.parentNode.replaceChild(newSpan, input);
    editIcon.style.display = "inline";
    socket.emit("update", { lot: lotId, filled: newFilled });
  };
  input.onkeypress = (e) => {
    if (e.key === "Enter") input.blur();
  };
  filledSpan.parentNode.replaceChild(input, filledSpan);
  editIcon.style.display = "none";
  input.focus();
}

// Edit max capacity
function editMax(lotId) {
  const maxSpan = document.getElementById(`max${lotId}`);
  const editIcon = document.getElementById(`editMaxIcon${lotId}`);
  const currentMax = parseInt(maxSpan.textContent);
  const input = document.createElement("input");
  input.type = "number";
  input.className = "edit-input-number";
  input.value = currentMax;
  input.min = "0";
  input.onblur = () => {
    const newMax = Math.max(0, parseInt(input.value) || 0);
    const newSpan = document.createElement("span");
    newSpan.id = `max${lotId}`;
    newSpan.textContent = newMax;
    input.parentNode.replaceChild(newSpan, input);
    editIcon.style.display = "inline";
    socket.emit("updateMax", { lot: lotId, max: newMax });
  };
  input.onkeypress = (e) => {
    if (e.key === "Enter") input.blur();
  };
  maxSpan.parentNode.replaceChild(input, maxSpan);
  editIcon.style.display = "none";
  input.focus();
}

// Increment or decrement filled spaces
function updateSpaces(lotId, change) {
  const currentFilled = parseInt(document.getElementById(lotId).textContent);
  const maxCapacity = parseInt(
    document.getElementById(`max${lotId}`).textContent,
  );
  const newFilled = Math.min(maxCapacity, Math.max(0, currentFilled + change));
  socket.emit("update", { lot: lotId, filled: newFilled });
}

// Set lot to full
function setFull(lotId) {
  const maxCapacity = parseInt(
    document.getElementById(`max${lotId}`).textContent,
  );
  socket.emit("update", { lot: lotId, filled: maxCapacity });
}

// Set lot to empty
function setEmpty(lotId) {
  socket.emit("update", { lot: lotId, filled: 0 });
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
  console.log("Received state:", lots);
  renderLots(lots);
});

socket.on("update", (data) => {
  const filledElement = document.getElementById(data.lot);
  if (filledElement && filledElement.tagName !== "INPUT") {
    filledElement.textContent = data.filled;
    updateFullPercentage(getCurrentLots());
  }
});

socket.on("rename", (data) => {
  const nameElement = document.getElementById(`name${data.lot}`);
  if (nameElement && nameElement.tagName !== "INPUT") {
    nameElement.textContent = data.name;
  }
});

socket.on("updateMax", (data) => {
  const maxElement = document.getElementById(`max${data.lot}`);
  if (maxElement && maxElement.tagName !== "INPUT") {
    maxElement.textContent = data.max;
    updateFullPercentage(getCurrentLots());
  }
});

socket.on("addLot", (lots) => {
  console.log("Received addLot:", lots);
  renderLots(lots);
});

socket.on("removeLot", (lots) => {
  renderLots(lots);
});

socket.on("reset", (lots) => {
  renderLots(lots);
});

// Helper to get current lots state from DOM
function getCurrentLots() {
  const lots = {};
  document.querySelectorAll(".lot").forEach((lotDiv) => {
    const lotId = lotDiv.querySelector('[id^="name"]').id.replace("name", "");
    lots[lotId] = {
      name: document.getElementById(`name${lotId}`).textContent,
      filled: parseInt(document.getElementById(lotId).textContent),
      max: parseInt(document.getElementById(`max${lotId}`).textContent),
    };
  });
  return lots;
}
