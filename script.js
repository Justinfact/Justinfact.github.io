const grid = document.getElementById('grid');
const gridSize = 40; // 40x40 grid
let currentObject = null; // Tracks the currently selected object for placement

// Counters to track HQs and Bear Traps
let hqCount = 0;
let bearTrapCount = 0;

// Track placed objects in an array
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
  if (!currentObject) return; // Do nothing if no object is selected

  // Enforce placement limits for HQs and Bear Traps
  if (currentObject.className === 'hq' && hqCount >= 1) {
    alert('Only 1 HQ is allowed on the grid.');
    return;
  }
  if (currentObject.className === 'bear-trap' && bearTrapCount >= 2) {
    alert('Only 2 Bear Traps are allowed on the grid.');
    return;
  }

  const tiles = document.querySelectorAll('.tile');
  const tileIndex = parseInt(event.target.dataset.index); // Use dataset to get the tile index
  const row = Math.floor(tileIndex / gridSize);
  const col = tileIndex % gridSize;

  // Validate placement
  if (canPlaceObject(row, col, currentObject.size)) {
    // Place the object
    for (let r = 0; r < currentObject.size; r++) {
      for (let c = 0; c < currentObject.size; c++) {
        const index = (row + r) * gridSize + (col + c);
        tiles[index].classList.add(currentObject.className);
        tiles[index].classList.remove('covered'); // Ensure object has display priority
      }
    }

    // Record this placement so we can undo it later
    placedObjects.push({
      row: row,
      col: col,
      size: currentObject.size,
      className: currentObject.className
    });

    // Add a border to the object if it's not a Banner
    if (currentObject.className !== 'banner') {
      applyObjectBorder(row, col, currentObject.size);
    }

    // Update counters for HQs and Bear Traps
    if (currentObject.className === 'hq') {
      hqCount++;
    } else if (currentObject.className === 'bear-trap') {
      bearTrapCount++;
    }

    // Highlight territory for HQ or Banner
    if (currentObject.className === 'hq') {
      highlightTerritory(row, col, 7); // HQ has a 15x15 total (7 tiles out in all directions)
    } else if (currentObject.className === 'banner') {
      highlightTerritory(row, col, 3); // Banner has a 7x7 total (3 tiles out in all directions)
    }

    currentObject = null; // Reset current object after placement
  } else {
    alert('Invalid placement!');
  }
}

function applyObjectBorder(row, col, size) {
  const tiles = document.querySelectorAll('.tile');

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const index = (row + r) * gridSize + (col + c);
      const tile = tiles[index];

      // Apply top border to the top row
      if (r === 0) tile.classList.add('object-border-top');
      // Apply bottom border to the bottom row
      if (r === size - 1) tile.classList.add('object-border-bottom');
      // Apply left border to the left column
      if (c === 0) tile.classList.add('object-border-left');
      // Apply right border to the right column
      if (c === size - 1) tile.classList.add('object-border-right');
    }
  }
}

// Highlight territory around a given tile
function highlightTerritory(centerRow, centerCol, radius) {
  const tiles = document.querySelectorAll('.tile');

  // Adjust the center for HQ to use the middle of the 3x3 object
  if (currentObject && currentObject.className === 'hq') {
    centerRow += 1; // Move down 1 row to the center
    centerCol += 1; // Move right 1 column to the center
  }

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

// Go back one step using pop and redraw the grid
function undoLastPlacement() {
  // If there’s nothing to undo, just return.
  if (placedObjects.length === 0) return;

  placedObjects.pop();

  recalculateCounters();
  
  clearGridVisualOnly();

  // Re‐place all objects that remain in placedObjects
  // (this also re‐applies territory coverage and borders)
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
    tile.style.border = '';  // clear inline border if you used it
  });
}

function placeObjectOnGrid(row, col, className, size) {
  const tiles = document.querySelectorAll('.tile');
  // Place the object tiles
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const index = (row + r) * gridSize + (col + c);
      tiles[index].classList.add(className);
      // remove default border if you’re doing that override
      tiles[index].classList.remove('object-border-top','object-border-right','object-border-bottom','object-border-left');
    }
  }

  // Apply outer borders
  applyObjectBorder(row, col, size);
  // If it’s HQ or Banner, highlight territory
  if (className === 'hq') {
    highlightTerritory(row, col, 7);
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

// Initialize the grid on page load
createGrid();
