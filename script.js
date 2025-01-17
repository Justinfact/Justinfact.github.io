// Script to manage the grid and object placement
const grid = document.getElementById('grid');
const gridSize = 40; // 40x40 grid

// Initialize the grid
function createGrid() {
  for (let i = 0; i < gridSize * gridSize; i++) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    grid.appendChild(tile);
  }
}

// Global function to clear all click event listeners from tiles
function clearTileListeners() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    const clone = tile.cloneNode(true); // Clone the tile to remove listeners
    tile.parentNode.replaceChild(clone, tile);
  });
}

// Add an object to the grid
function addObject(className, size) {
  clearTileListeners(); // Clear existing listeners before adding new ones

  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    tile.addEventListener('click', function placeObject() {
      // Determine the row and column of the clicked tile
      const tileIndex = Array.from(tiles).indexOf(this);
      const row = Math.floor(tileIndex / gridSize);
      const col = tileIndex % gridSize;

      // Validate and place the object if placement is valid
      if (canPlaceObject(row, col, size)) {
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const index = (row + r) * gridSize + (col + c);
            tiles[index].classList.add(className);
          }
        }
      } else {
        alert('Invalid placement!');
      }

      // Clear listeners after placement attempt
      clearTileListeners();
    });
  });
}

// Validate object placement
function canPlaceObject(row, col, size) {
  // Check if the object goes out of bounds
  if (row + size > gridSize || col + size > gridSize) return false;

  const tiles = document.querySelectorAll('.tile');
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const index = (row + r) * gridSize + (col + c);

      // Check if the tile is already occupied
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
  });
}

// Event listeners for toolbar buttons
document.getElementById('add-bear-trap').addEventListener('click', () => addObject('bear-trap', 3));
document.getElementById('add-hq').addEventListener('click', () => addObject('hq', 3));
document.getElementById('add-furnace').addEventListener('click', () => addObject('furnace', 2));
document.getElementById('add-banner').addEventListener('click', () => addObject('banner', 1));
document.getElementById('clear-grid').addEventListener('click', clearGrid);

// Initialize the grid on page load
createGrid();
