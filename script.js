const grid = document.getElementById('grid');
const gridSize = 40; // 40x40 grid
let currentObject = null; // Tracks the currently selected object for placement

// Counters to track HQs and Bear Traps
let hqCount = 0;
let bearTrapCount = 0;

// Track placed objects in an array so we can undo them if needed
let placedObjects = [];

// Initialize the grid
function createGrid() {
  for (let i = 0; i < gridSize * gridSize; i++) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.dataset.index = i; // Add a unique index for each tile
    tile.addEventListener('click', handleTileClick); // Add click listener to each tile
    grid.appendChild(tile);
  }
}

function applyObjectBorder(row, col, size, className) {
  const tiles = document.querySelectorAll('.tile');

  // Loop through the object's grid
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const index = (row + r) * gridSize + (col + c);
      const tile = tiles[index];

      // Apply top border to the top row
      if (r === 0) {
        tile.classList.add('object-border-top');
      }
      // Apply bottom border to the bottom row
      if (r === size - 1) {
        tile.classList.add('object-border-bottom');
      }
      // Apply left border to the left column
      if (c === 0) {
        tile.classList.add('object-border-left');
      }
      // Apply right border to the right column
      if (c === size - 1) {
        tile.classList.add('object-border-right');
      }
    }
  }
}

function handleTileClick(event) {
  if (!currentObject) return;

  // Enforce placement limits
  if (currentObject.className === 'hq' && hqCount >= 1) {
    alert('Only 1 HQ is allowed on the grid.');
    return;
  }
  if (currentObject.className === 'bear-trap' && bearTrapCount >= 2) {
    alert('Only 2 Bear Traps are allowed on the grid.');
    return;
  }

  const tileIndex = parseInt(event.target.dataset.index);
  const row = Math.floor(tileIndex / gridSize);
  const col = tileIndex % gridSize;

  // Validate
  if (canPlaceObject(row, col, currentObject.size)) {

    // Place the object (visually)
    placeObjectOnGrid(row, col, currentObject.className, currentObject.size);

    // ►► Record the placed object
    placedObjects.push({
      row,
      col,
      size: currentObject.size,
      className: currentObject.className
    });

    // Update counters
    if (currentObject.className === 'hq') hqCount++;
    if (currentObject.className === 'bear-trap') bearTrapCount++;

    // Clear the current selection
    currentObject = null;
  } else {
    alert('Invalid placement!');
  }
}

// Add borders to the various objects
function applyObjectBorder(row, col, size) {
  const tiles = document.querySelectorAll('.tile');

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const index = (row + r) * gridSize + (col + c);
      const tile = tiles[index];

      if (r === 0) tile.classList.add('object-border-top');
      if (r === size - 1) tile.classList.add('object-border-bottom');
      if (c === 0) tile.classList.add('object-border-left');
      if (c === size - 1) tile.classList.add('object-border-right');
    }
  }
}

// Highlight territory around a given tile
function highlightTerritory(centerRow, centerCol, radius) {
  const tiles = document.querySelectorAll('.tile');

  for (let r = -radius; r <= radius; r++) {
    for (let c = -radius; c <= radius; c++) {
      const row = centerRow + r;
      const col = centerCol + c;
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        const index = row * gridSize + col;
        if (
          !tiles[index].classList.contains('bear-trap') &&
          !tiles[index].classList.contains('hq') &&
          !tiles[index].classList.contains('furnace') &&
          !tiles[index].classList.contains('banner')
        ) {
          tiles[index].classList.add('covered'); // Highlight as alliance territory
        }
      }
    }
  }
}

// Validate object placement
function canPlaceObject(row, col, size) {
  if (row + size > gridSize || col + size > gridSize) return false;

  const tiles = document.querySelectorAll('.tile');
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const index = (row + r) * gridSize + (col + c);
      if (
        index >= tiles.length || // Out of grid range
        tiles[index].classList.contains('bear-trap') ||
        tiles[index].classList.contains('hq') ||
        tiles[index].classList.contains('furnace') ||
        tiles[index].classList.contains('banner')
      ) {
        return false;
      }
    }
  }
  return true;
}

// Called from Undo button, revert last action
function undoLastPlacement() {
  // If there’s nothing to undo, just return.
  if (placedObjects.length === 0) return;

  // Remove most recenty object
  placedObjects.pop();

  // Recalculate the counters
  recalculateCounters();
  
  // Clear the grid visually
  clearGridVisualOnly();

  // Replace all objects that remain in placedObjects
  for (const obj of placedObjects) {
    placeObjectOnGrid(obj.row, obj.col, obj.className, obj.size);
  }
}

// Reset counters if the removed object was an HQ or Bear Trap.
// (We will also recalculate them from the array if needed)
function recalculateCounters() {
  hqCount = 0;
  bearTrapCount = 0;
  for (const obj of placedObjects) {
    if (obj.className === 'hq') hqCount++;
    if (obj.className === 'bear-trap') bearTrapCount++;
  }
}

// Clear the grid visually.
function clearGridVisualOnly() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    tile.className = 'tile'; // revert to just "tile"
    tile.dataset.name = '';
    tile.style.border = '';  // clear inline border
  });
}

function placeObjectOnGrid(row, col, className, size) {
  const tiles = document.querySelectorAll('.tile');

  // Place the object tiles
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const index = (row + r) * gridSize + (col + c);
      tiles[index].classList.add(className);
      // ensure it's not covered
      tiles[index].classList.remove('object-border-top','object-border-right','object-border-bottom','object-border-left','covered');
    }
  }

  // Apply outer borders
  applyObjectBorder(row, col, size);
  
  // If it’s HQ or Banner, highlight territory
  if (className === 'hq') {
    highlightTerritory(row + 1, col + 1, 7);
  } else if (className === 'banner') {
    highlightTerritory(row, col, 3);
  }
}

// Clear the grid
function clearGrid() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    tile.className = 'tile';
    tile.dataset.name = '';
  });
  currentObject = null; // Clear any selected object
  hqCount = 0; // Reset HQ counter
  bearTrapCount = 0; // Reset Bear Trap counter
}

function saveLayout() {
  // 1) Convert your placedObjects array (or other data) to a JSON string
  const layoutJSON = JSON.stringify(placedObjects);

  // 2) Create a Blob from the string
  const blob = new Blob([layoutJSON], { type: 'application/json' });

  // 3) Generate a URL for the Blob
  const url = URL.createObjectURL(blob);

  // 4) Create an <a> element to download the Blob as a file
  const link = document.createElement('a');
  link.href = url;
  link.download = 'layout.json'; // The filename for the downloaded file
  link.click();

  // 5) Revoke the URL to free up memory
  URL.revokeObjectURL(url);
}

function loadLayout(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      // 1) Parse the JSON
      const loadedData = JSON.parse(e.target.result);

      // 2) Replace your placedObjects array with the loaded data
      placedObjects = loadedData;

      // 3) Recalculate counters (HQs, Bear Traps, etc.)
      recalculateCounters(); // if you have a helper function for that

      // 4) Clear the grid visually
      clearGridVisualOnly(); // or clearGrid() if you prefer

      // 5) Re-draw all objects from the newly loaded placedObjects
      for (const obj of placedObjects) {
        placeObjectOnGrid(obj.row, obj.col, obj.className, obj.size);
      }

    } catch(err) {
      console.error('Error parsing layout JSON: ', err);
      alert('Failed to load layout. Invalid JSON file?');
    }
  };

  reader.readAsText(file);
}

// Set the current object for placement
function addObject(className, size) {
  currentObject = { className, size }; // Set the current object and size
}

// Event listeners for toolbar buttons
document.getElementById('undo').addEventListener('click', undoLastPlacement);
document.getElementById('add-bear-trap').addEventListener('click', () => addObject('bear-trap', 3));
document.getElementById('add-hq').addEventListener('click', () => addObject('hq', 3));
document.getElementById('add-furnace').addEventListener('click', () => addObject('furnace', 2));
document.getElementById('add-banner').addEventListener('click', () => addObject('banner', 1));
document.getElementById('clear-grid').addEventListener('click', clearGrid);
document.getElementById('save-layout').addEventListener('click', saveLayout);
document.getElementById('load-layout').addEventListener('change', loadLayout);

// Initialize the grid on page load
createGrid();
