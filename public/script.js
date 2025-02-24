const socket = io();

function updateSpaces(lotId, change) {
  const currentSpaces = parseInt(document.getElementById(lotId).textContent);
  const newSpaces = Math.max(0, currentSpaces + change); // Prevent negative counts
  socket.emit("update", { lot: lotId, spaces: newSpaces });
}

socket.on("update", (data) => {
  document.getElementById(data.lot).textContent = data.spaces;
});
