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
      // Validate placement
      const tileIndex = Array.from(tiles).indexOf(this);
      const row = Math.floor(tileIndex / gridSize);
      const col = tileIndex % gridSize;

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

      // Remove click listeners after placing the object
      tiles.forEach(tile => tile.removeEventListener('click', placeObject));
    });
  });
}

// Validate object placement
function canPlaceObject(row, col, size) {
  if (row + size > gridSize || col + size > gridSize) return false; // Out of bounds
  const tiles = document.querySelectorAll('.tile');
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const index = (row + r) * gridSize + (col + c);
      if (tiles[index].classList.contains('bear-trap') ||
          tiles[index].classList.contains('hq') ||
          tiles[index].classList.contains('furnace') ||
          tiles[index].classList.contains('banner')) {
        return false; // Overlap detected
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
