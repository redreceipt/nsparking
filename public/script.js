const socket = io();
const lotsContainer = document.getElementById("lots");
const fullPercentageSpan = document.getElementById("full-percentage");

// Render a single lot
function renderLot(lotId, name, spaces, max) {
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
            <p class="empty-spaces">Empty Spaces: <span id="${lotId}">${spaces}</span><span class="edit-icon" id="editSpacesIcon${lotId}" onclick="editSpaces('${lotId}')">✎</span></p>
        </div>
        <div class="button-group">
            <button onclick="updateSpaces('${lotId}', 1)">+</button>
            <button onclick="updateSpaces('${lotId}', -1)">-</button>
        </div>
        <button class="remove-button" onclick="removeLot('${lotId}')">Remove</button>
    `;
  lotsContainer.appendChild(lotDiv);
}

// Clear and re-render all lots
function renderLots(lots) {
  lotsContainer.innerHTML = "";
  Object.keys(lots).forEach((lotId) => {
    renderLot(lotId, lots[lotId].name, lots[lotId].spaces, lots[lotId].max);
  });
  updateFullPercentage(lots);
}

// Update full lot percentage
function updateFullPercentage(lots) {
  const totalMax = Object.values(lots).reduce((sum, lot) => sum + lot.max, 0);
  const totalOccupied = Object.values(lots).reduce(
    (sum, lot) => sum + (lot.max - lot.spaces),
    0,
  );
  const percentage =
    totalMax > 0 ? Math.round((totalOccupied / totalMax) * 100) : 0;
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

// Edit lot spaces
function editSpaces(lotId) {
  const spacesSpan = document.getElementById(lotId);
  const maxSpan = document.getElementById(`max${lotId}`);
  const editIcon = document.getElementById(`editSpacesIcon${lotId}`);
  const currentSpaces = parseInt(spacesSpan.textContent);
  const maxCapacity = parseInt(maxSpan.textContent);
  const input = document.createElement("input");
  input.type = "number";
  input.className = "edit-input-number";
  input.value = currentSpaces;
  input.min = "0";
  input.max = maxCapacity; // Set max attribute for HTML validation
  input.onblur = () => {
    const newSpaces = Math.min(
      maxCapacity,
      Math.max(0, parseInt(input.value) || 0),
    ); // Cap at maxCapacity
    const newSpan = document.createElement("span");
    newSpan.id = lotId;
    newSpan.textContent = newSpaces;
    input.parentNode.replaceChild(newSpan, input);
    editIcon.style.display = "inline";
    socket.emit("update", { lot: lotId, spaces: newSpaces });
  };
  input.onkeypress = (e) => {
    if (e.key === "Enter") input.blur();
  };
  spacesSpan.parentNode.replaceChild(input, spacesSpan);
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

// Increment or decrement spaces
function updateSpaces(lotId, change) {
  const currentSpaces = parseInt(document.getElementById(lotId).textContent);
  const maxCapacity = parseInt(
    document.getElementById(`max${lotId}`).textContent,
  );
  const newSpaces = Math.min(maxCapacity, Math.max(0, currentSpaces + change)); // Cap at maxCapacity
  socket.emit("update", { lot: lotId, spaces: newSpaces });
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
  const spacesElement = document.getElementById(data.lot);
  if (spacesElement && spacesElement.tagName !== "INPUT") {
    spacesElement.textContent = data.spaces;
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
      spaces: parseInt(document.getElementById(lotId).textContent),
      max: parseInt(document.getElementById(`max${lotId}`).textContent),
    };
  });
  return lots;
}
