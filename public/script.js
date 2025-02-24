const socket = io();
const lotsContainer = document.getElementById("lots");

// Render a single lot
function renderLot(lotId, name, spaces) {
  const lotDiv = document.createElement("div");
  lotDiv.className = "lot";
  lotDiv.innerHTML = `
        <div class="name-container">
            <h2><span id="name${lotId}">${name}</span><span class="edit-icon" id="editNameIcon${lotId}" onclick="editName('${lotId}')">✎</span></h2>
        </div>
        <div class="spaces-container">
            <p>Empty Spaces: <span id="${lotId}">${spaces}</span><span class="edit-icon" id="editSpacesIcon${lotId}" onclick="editSpaces('${lotId}')">✎</span></p>
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
    renderLot(lotId, lots[lotId].name, lots[lotId].spaces);
  });
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
  const editIcon = document.getElementById(`editSpacesIcon${lotId}`);
  const currentSpaces = parseInt(spacesSpan.textContent);
  const input = document.createElement("input");
  input.type = "number";
  input.className = "edit-input-number";
  input.value = currentSpaces;
  input.min = "0";
  input.onblur = () => {
    const newSpaces = Math.max(0, parseInt(input.value) || 0);
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

// Increment or decrement spaces
function updateSpaces(lotId, change) {
  const currentSpaces = parseInt(document.getElementById(lotId).textContent);
  const newSpaces = Math.max(0, currentSpaces + change);
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
  }
});

socket.on("rename", (data) => {
  const nameElement = document.getElementById(`name${data.lot}`);
  if (nameElement && nameElement.tagName !== "INPUT") {
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
