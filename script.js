const grid = document.getElementById('grid');
const gridSize = 40; // 40x40 grid
let currentObject = null; // Tracks the currently selected object for placement
const coverage = new Set(); // Tracks covered tiles for territory

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
      }
    }

    // Highlight territory for HQ or Banner
    if (currentObject.className === 'hq') {
      highlightTerritory(row, col, 15);
    } else if (currentObject.className === 'banner') {
      highlightTerritory(row, col, 7);
    }

    // Handle furnace naming
    if (currentObject.className === 'furnace') {
      promptFurnaceName(row, col);
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
        if (!tiles[index].classList.contains('hq') && !tiles[index].classList.contains('banner')) {
          tiles[index].classList.add('covered');
          coverage.add(index);
        }
      }
    }
  }
}

// Prompt user for furnace name
function promptFurnaceName(row, col) {
  const name = prompt('Enter player name for this Furnace:', 'Player');
  if (name) {
    const tiles = document.querySelectorAll('.tile');
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const index = (row + r) * gridSize + (col + c);
        tiles[index].dataset.name = name;
        tiles[index].classList.add('named'); // Add a visual indicator
      }
    }
    alert(`Assigned "${name}" to the Furnace.`);
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

// Save layout to JSON
function saveLayout() {
  const tiles = document.querySelectorAll('.tile');
  const layout = Array.from(tiles).map(tile => ({
    className: tile.className,
    name: tile.dataset.name || null,
    index: tile.dataset.index
  }));
  const json = JSON.stringify(layout);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bear_trap_layout.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Load layout from JSON
function loadLayout(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    const layout = JSON.parse(reader.result);
    clearGrid();
    layout.forEach(tile => {
      const gridTile = document.querySelector(`.tile[data-index="${tile.index}"]`);
      if (gridTile) {
        gridTile.className = tile.className;
        if (tile.name) gridTile.dataset.name = tile.name;
      }
    });
  };
  reader.readAsText(file);
}

// Clear the grid
function clearGrid() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    tile.className = 'tile';
    tile.dataset.name = '';
  });
  currentObject = null;
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
document.getElementById('save-layout').addEventListener('click', saveLayout);
document.getElementById('load-layout').addEventListener('change', loadLayout);

// Initialize the grid on page load
createGrid();
