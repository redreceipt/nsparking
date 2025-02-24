const socket = io({
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});
console.log("Socket initialized");
const lotsContainer = document.getElementById("lots");
const fullPercentageSpan = document.getElementById("full-percentage");
console.log("DOM elements loaded:", lotsContainer, fullPercentageSpan);

socket.on("connect", () => console.log("Socket connected to server"));
socket.on("disconnect", () => console.log("Socket disconnected from server"));

// Render a single lot
function renderLot(lotId, name, filled, max, index, totalLotsInSection) {
  return `
    <div class="lot">
      <div class="name-container">
        <h3>
          <span class="arrow-icon left-arrow ${index === 0 ? "disabled" : ""}" onclick="moveLotUp('${lotId}')">◄</span>
          <span id="name${lotId}" class="lot-name">${name}</span>
          <span class="edit-icon" id="editNameIcon${lotId}" onclick="editName('${lotId}')">✎</span>
          <span class="arrow-icon right-arrow ${index === totalLotsInSection - 1 ? "disabled" : ""}" onclick="moveLotDown('${lotId}')">►</span>
        </h3>
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
    </div>
  `;
}

// Render all lots grouped by sections
function renderLots(lots) {
  console.log("Rendering lots:", lots);
  lotsContainer.innerHTML = "";

  // Group lots by section
  const sections = {};
  Object.entries(lots).forEach(([lotId, lot]) => {
    const sectionName = lot.section || "Ungrouped";
    if (!sections[sectionName]) sections[sectionName] = [];
    sections[sectionName].push({ lotId, ...lot });
  });

  // Render each section
  Object.entries(sections).forEach(([sectionName, sectionLots]) => {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "section";
    sectionDiv.innerHTML = `
      <div class="section-header">
        <span class="collapse-toggle" onclick="toggleSection(this)">▼</span>
        <span class="section-name" id="section-${sectionName}">${sectionName}</span>
        <span class="edit-icon" id="editSectionIcon-${sectionName}" onclick="editSectionName('${sectionName}')">✎</span>
      </div>
      <div class="section-lots">
        ${sectionLots.map((lot, index) => renderLot(lot.lotId, lot.name, lot.filled, lot.max, index, sectionLots.length)).join("")}
        <button class="add-lot-btn" onclick="addLotToSection('${sectionName}')">Add New Lot</button>
      </div>
    `;
    lotsContainer.appendChild(sectionDiv);
  });

  updateFullPercentage(lots);
  console.log("Lots rendered, sections:", Object.keys(sections));
}

// Toggle section collapse
function toggleSection(toggle) {
  const sectionLots = toggle.parentElement.nextElementSibling;
  const isCollapsed = sectionLots.style.display === "none";
  sectionLots.style.display = isCollapsed ? "block" : "none";
  toggle.textContent = isCollapsed ? "▼" : "▲";
}

// Edit section name
function editSectionName(sectionName) {
  const sectionSpan = document.getElementById(`section-${sectionName}`);
  const editIcon = document.getElementById(`editSectionIcon-${sectionName}`);
  const currentName = sectionSpan.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "edit-input";
  input.value = currentName;
  input.onblur = () => {
    const newName = input.value.trim() || currentName;
    const newSpan = document.createElement("span");
    newSpan.id = `section-${newName}`;
    newSpan.className = "section-name";
    newSpan.textContent = newName;
    input.parentNode.replaceChild(newSpan, input);
    editIcon.style.display = "inline";
    const lots = getCurrentLots();
    Object.values(lots).forEach((lot) => {
      if (lot.section === sectionName) lot.section = newName;
    });
    const newLots = {};
    Object.entries(lots).forEach(([lotId, lot]) => (newLots[lotId] = lot));
    socket.emit("reorder", newLots);
    renderLots(newLots);
  };
  input.onkeypress = (e) => {
    if (e.key === "Enter") input.blur();
  };
  sectionSpan.parentNode.replaceChild(input, sectionSpan);
  editIcon.style.display = "none";
  input.focus();
}

// Add lot to a specific section
function addLotToSection(sectionName) {
  socket.emit("addLot", { section: sectionName });
}

// Add a new section
function addSection() {
  const newSectionName = prompt("Enter new section name:");
  if (newSectionName && newSectionName.trim()) {
    const lots = getCurrentLots();
    // Create a new lot in the new section to ensure it appears
    socket.emit("addLot", { section: newSectionName.trim() });
  }
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
    newSpan.className = "lot-name";
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

// Move lot up (left)
function moveLotUp(lotId) {
  console.log(`Moving ${lotId} up`);
  const lots = getCurrentLots();
  const lotIds = Object.keys(lots);
  const index = lotIds.indexOf(lotId);
  if (index > 0) {
    const newLotIds = [...lotIds];
    [newLotIds[index], newLotIds[index - 1]] = [
      newLotIds[index - 1],
      newLotIds[index],
    ];
    const reorderedLots = {};
    newLotIds.forEach((id) => (reorderedLots[id] = lots[id]));
    console.log("Emitting reorder (up):", reorderedLots);
    socket.emit("reorder", reorderedLots);
  } else {
    console.log(`${lotId} already at top`);
  }
}

// Move lot down (right)
function moveLotDown(lotId) {
  console.log(`Moving ${lotId} down`);
  const lots = getCurrentLots();
  const lotIds = Object.keys(lots);
  const index = lotIds.indexOf(lotId);
  if (index < lotIds.length - 1) {
    const newLotIds = [...lotIds];
    [newLotIds[index], newLotIds[index + 1]] = [
      newLotIds[index + 1],
      newLotIds[index],
    ];
    const reorderedLots = {};
    newLotIds.forEach((id) => (reorderedLots[id] = lots[id]));
    console.log("Socket connected:", socket.connected);
    console.log("Emitting reorder (down):", reorderedLots);
    socket.emit("reorder", reorderedLots);
  } else {
    console.log(`${lotId} already at bottom`);
  }
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

socket.on("reorder", (lots) => {
  console.log("Received reorder:", lots);
  renderLots(lots);
});

// Helper to get current lots state from DOM
function getCurrentLots() {
  const lots = {};
  document.querySelectorAll(".lot").forEach((lotDiv) => {
    const lotId = lotDiv.querySelector('[id^="name"]').id.replace("name", "");
    const sectionDiv = lotDiv.closest(".section");
    const sectionName = sectionDiv.querySelector(".section-name").textContent;
    lots[lotId] = {
      name: document.getElementById(`name${lotId}`).textContent,
      filled: parseInt(document.getElementById(lotId).textContent),
      max: parseInt(document.getElementById(`max${lotId}`).textContent),
      section: sectionName,
    };
  });
  return lots;
}
