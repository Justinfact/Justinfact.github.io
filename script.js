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

// Add an object to the grid
function addObject(className, size) {
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
        // Remove the click listener after placement
        tiles.forEach(tile => tile.removeEventListener('click', placeObject));
      } else {
        alert('Invalid placement!');
        // Remove click listeners even if placement fails to prevent 3x3 fallback
        tiles.forEach(tile => tile.removeEventListener('click', placeObject));
      }
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
