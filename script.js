const grid = document.getElementById('grid');
const gridSize = 40; // 40x40 grid
let currentObject = null; // Tracks the currently selected object for placement

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

// Handle tile click for placement
function handleTileClick(event) {
  if (!currentObject) return; // Do nothing if no object is selected

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

// Clear the grid
function clearGrid() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    tile.className = 'tile';
    tile.dataset.name = '';
  });
  currentObject = null; // Clear any selected object
}

// Set the current object for placement
function addObject(className, size) {
  currentObject = { className, size }; // Set the current object and size
}

// Event listeners for toolbar buttons
document.getElementById('add-bear-trap').addEventListener('click', () => addObject('bear-trap', 3));
document.getElementById('add-hq').addEventListener('click', () => addObject('hq', 3));
document.getElementById('add-furnace').addEventListener('click', () => addObject('furnace', 2));
document.getElementById('add-banner').addEventListener('click', () => addObject('banner', 1));
document.getElementById('clear-grid').addEventListener('click', clearGrid);

// Initialize the grid on page load
createGrid();
