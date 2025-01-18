const grid = document.getElementById('grid');
const gridSize = 40; // 40x40 grid
let currentObject = null; // Tracks the currently selected object for *new* placement

// Counters to track HQs and Bear Traps
let hqCount = 0;
let bearTrapCount = 0;

// Track placed objects in an array so we can undo them if needed
let placedObjects = [];

// DRAG & DROP CHANGES – Additional variables for dragging
let isDragging = false;
let draggedObject = null;        // The placedObjects entry for the object being dragged
let dragOriginalPosition = null; // {row, col} before drag
let dragOffset = {row: 0, col: 0}; // If user clicked somewhere in the middle of the object
const dragGhost = document.getElementById('drag-ghost'); // The hidden ghost element

// Initialize the grid
function createGrid() {
  for (let i = 0; i < gridSize * gridSize; i++) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.dataset.index = i; // Add a unique index for each tile

    // Instead of click, we add mousedown to start possibly dragging an existing object
    tile.addEventListener('mousedown', handleTileMouseDown);
    grid.appendChild(tile);
  }

  // DRAG & DROP CHANGES: Listen for mousemove/up at the document level
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

// Original function for tile clicks when placing brand-new objects
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

  if (canPlaceObject(row, col, currentObject.size)) {
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

    currentObject = null;
  } else {
    alert('Invalid placement!');
  }
}

// DRAG & DROP CHANGES: 
// On mousedown, we decide if the user is trying to drag an existing object or place a new one.
function handleTileMouseDown(e) {
  // If we are in "placing a new object" mode, just run the existing handleTileClick
  if (currentObject) {
    handleTileClick(e);
    return;
  }

  // If not placing a new object, we check if the tile belongs to an existing object
  const tileIndex = parseInt(e.target.dataset.index);
  const row = Math.floor(tileIndex / gridSize);
  const col = tileIndex % gridSize;

  // Find which placed object the user clicked on, if any
  const obj = findObjectAt(row, col);
  if (obj) {
    // Begin drag
    isDragging = true;
    draggedObject = obj;
    dragOriginalPosition = { row: obj.row, col: obj.col };

    // Determine offset inside the object (so that the ghost doesn't “jump” 
    // if the user clicked on the bottom-right corner of a 3x3, for example)
    dragOffset.row = row - obj.row;
    dragOffset.col = col - obj.col;

    // Remove the object visually from the grid to avoid seeing it in two places
    removeObjectFromGrid(obj);

    // Initialize drag ghost's appearance
    showDragGhost(obj);

    // Prevent text selection / drag conflict
    e.preventDefault();
  }
}

// Helper to find which placed object (if any) covers (row, col)
function findObjectAt(row, col) {
  // Reverse iterate so we find the topmost object if you had overlapping (shouldn’t happen normally).
  for (let i = placedObjects.length - 1; i >= 0; i--) {
    const obj = placedObjects[i];
    if (row >= obj.row && row < obj.row + obj.size &&
        col >= obj.col && col < obj.col + obj.size) {
      return obj;
    }
  }
  return null;
}

// Helper to remove an object’s classes from the grid so we can “lift” it
function removeObjectFromGrid(obj) {
  const tiles = document.querySelectorAll('.tile');
  for (let r = 0; r < obj.size; r++) {
    for (let c = 0; c < obj.size; c++) {
      const index = (obj.row + r) * gridSize + (obj.col + c);
      tiles[index].classList.remove(obj.className);
      tiles[index].classList.remove('object-border-top','object-border-right','object-border-bottom','object-border-left','covered');
    }
  }
  // If it was an HQ or banner, we also need to remove coverage. Just do a full clear and re-place everything else:
  clearGridVisualOnly();
  // Then re-draw all objects except the one we're dragging
  for (const o of placedObjects) {
    if (o !== draggedObject) {
      placeObjectOnGrid(o.row, o.col, o.className, o.size);
    }
  }
}

// Create a visual representation of the object in the dragGhost
function showDragGhost(obj) {
  dragGhost.innerHTML = '';

  // We'll build a small grid of divs representing the object
  for (let r = 0; r < obj.size; r++) {
    const rowDiv = document.createElement('div');
    rowDiv.style.display = 'flex';
    for (let c = 0; c < obj.size; c++) {
      const cell = document.createElement('div');
      cell.style.width = '20px';
      cell.style.height = '20px';
      cell.style.boxSizing = 'border-box';
      cell.style.border = '1px solid #999';

      cell.classList.add(obj.className);

      rowDiv.appendChild(cell);
    }
    dragGhost.appendChild(rowDiv);
  }

  dragGhost.style.display = 'block';
}

/* // While mouse is moving, if isDragging == true, move the ghost with the cursor
function handleMouseMove(e) {
  if (!isDragging || !draggedObject) return;

  // Position the ghost near the cursor
  // We can offset it by half the object size or by tile sizes, but this is up to your preference.
  dragGhost.style.left = e.pageX + 5 + 'px';
  dragGhost.style.top = e.pageY + 5 + 'px';

  // Optional: highlight coverage area in real time  
  // Find which tile in the grid the mouse is “over” (if any)
  const tileUnderMouse = getTileFromMouseEvent(e);
  clearRealTimeCoverage(); // remove coverage highlights from last frame
  if (tileUnderMouse) {
    const { row, col } = tileUnderMouse;
    // The top-left corner of the object if we drop it *right now* is:
    const newRow = row - dragOffset.row;
    const newCol = col - dragOffset.col;

    // If it’s within grid bounds (with object size accounted for), highlight coverage
    if (newRow >= 0 && newCol >= 0 && 
        newRow + draggedObject.size <= gridSize && 
        newCol + draggedObject.size <= gridSize) {
      // If HQ or banner, highlight territory as if it’s placed at (newRow, newCol)
      if (draggedObject.className === 'hq') {
        highlightTerritory(newRow + 1, newCol + 1, 7);
      } 
      else if (draggedObject.className === 'banner') {
        highlightTerritory(newRow, newCol, 3);
      }
      // Optionally, you can also highlight the “would-be” border around the object tiles
      highlightObjectBorder(newRow, newCol, draggedObject.size);
    }
  }
} */

  function handleMouseMove(e) {
    if (!isDragging || !draggedObject) return;
  
    // 1) Find the tile under the mouse
    const tileUnderMouse = getTileFromMouseEvent(e);
  
    // 2) Clear the last frame's real-time coverage
    clearRealTimeCoverage();
  
    // 3) If user is over the grid, snap the ghost to the new (row, col)
    if (tileUnderMouse) {
      const newRow = tileUnderMouse.row - dragOffset.row;
      const newCol = tileUnderMouse.col - dragOffset.col;
  
      // Only if inside valid grid range, we also highlight territory/borders
      if (
        newRow >= 0 && 
        newCol >= 0 && 
        newRow + draggedObject.size <= gridSize &&
        newCol + draggedObject.size <= gridSize
      ) {
        // HQ or banner coverage preview
        if (draggedObject.className === 'hq') {
          highlightTerritory(newRow + 1, newCol + 1, 7);
        } else if (draggedObject.className === 'banner') {
          highlightTerritory(newRow, newCol, 3);
        }
        // border preview
        highlightObjectBorder(newRow, newCol, draggedObject.size);
      }
  
      // 4) Position ghost so that it lines up on the same tiles
      //    Instead of e.pageX/e.pageY, figure out the grid’s left/top
      const rect = grid.getBoundingClientRect();
      dragGhost.style.left = (rect.left + newCol * 20) + 'px';
      dragGhost.style.top  = (rect.top  + newRow * 20) + 'px';
  
    } else {
      // If outside the grid, you could:
      //  - just move the ghost under the cursor
      //  - or hide the ghost
      //  - or do something else
      dragGhost.style.left = e.pageX + 'px';
      dragGhost.style.top  = e.pageY + 'px';
    }
  }

// Map mouse x/y to a grid tile row/col (returns null if outside)
function getTileFromMouseEvent(e) {
  const rect = grid.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Each tile is 20px (width) × 20px (height) in your CSS
  if (x < 0 || y < 0) return null;
  const col = Math.floor(x / 20);
  const row = Math.floor(y / 20);
  
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
    return null;
  }
  return { row, col };
}

// Clear real-time coverage highlights (removes the “covered” class, etc.)
function clearRealTimeCoverage() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    if (!tile.classList.contains('bear-trap') &&
        !tile.classList.contains('hq') &&
        !tile.classList.contains('furnace') &&
        !tile.classList.contains('banner') &&
        !tile.classList.contains('resource-node') &&
        !tile.classList.contains('non-buildable-area')) {
      // Only remove “covered” if it’s not one of the placed object’s real coverage
      tile.classList.remove('covered');
    }
    tile.classList.remove('object-border-top','object-border-right','object-border-bottom','object-border-left');
  });

  // Re-draw borders for existing placed objects that remain
  for (const obj of placedObjects) {
    if (obj !== draggedObject) {
      applyObjectBorder(obj.row, obj.col, obj.size);
      if (obj.className === 'hq') highlightTerritory(obj.row + 1, obj.col + 1, 7);
      else if (obj.className === 'banner') highlightTerritory(obj.row, obj.col, 3);
    }
  }
}

// Optionally highlight the object border while dragging
function highlightObjectBorder(row, col, size) {
  const tiles = document.querySelectorAll('.tile');
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const index = (row + r) * gridSize + (col + c);
      const tile = tiles[index];
      if (!tile) continue;
      if (r === 0) tile.classList.add('object-border-top');
      if (r === size - 1) tile.classList.add('object-border-bottom');
      if (c === 0) tile.classList.add('object-border-left');
      if (c === size - 1) tile.classList.add('object-border-right');
    }
  }
}

// On mouseup, finalize or revert the drop
function handleMouseUp(e) {
  if (!isDragging || !draggedObject) return;

  isDragging = false;
  dragGhost.style.display = 'none'; // hide ghost

  // Figure out where we “dropped” it
  const tileUnderMouse = getTileFromMouseEvent(e);
  if (!tileUnderMouse) {
    // Outside the grid – revert
    placeObjectOnGrid(dragOriginalPosition.row, dragOriginalPosition.col, draggedObject.className, draggedObject.size);
    draggedObject.row = dragOriginalPosition.row;
    draggedObject.col = dragOriginalPosition.col;
    draggedObject = null;
    return;
  }

  const { row, col } = tileUnderMouse;
  const newRow = row - dragOffset.row;
  const newCol = col - dragOffset.col;

  // Check collision
  if (!canPlaceObject(newRow, newCol, draggedObject.size)) {
    alert('Invalid placement! Overlaps or out of bounds.');
    // revert
    placeObjectOnGrid(dragOriginalPosition.row, dragOriginalPosition.col, draggedObject.className, draggedObject.size);
    draggedObject.row = dragOriginalPosition.row;
    draggedObject.col = dragOriginalPosition.col;
    draggedObject = null;
    return;
  }

  // Otherwise, place at new location
  draggedObject.row = newRow;
  draggedObject.col = newCol;
  placeObjectOnGrid(newRow, newCol, draggedObject.className, draggedObject.size);
  
  draggedObject = null;
  clearRealTimeCoverage();
}

// Validate object placement
function canPlaceObject(row, col, size) {
  if (row + size > gridSize || col + size > gridSize) return false;

  const tiles = document.querySelectorAll('.tile');
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const index = (row + r) * gridSize + (col + c);
      if (
        index >= tiles.length ||
        tiles[index].classList.contains('bear-trap') ||
        tiles[index].classList.contains('hq') ||
        tiles[index].classList.contains('furnace') ||
        tiles[index].classList.contains('banner') ||
        tiles[index].classList.contains('resource-node') ||
        tiles[index].classList.contains('non-buildable-area')
      ) {
        return false;
      }
    }
  }
  return true;
}

// Called from Undo button
function undoLastPlacement() {
  if (placedObjects.length === 0) return;
  placedObjects.pop();
  recalculateCounters();
  clearGridVisualOnly();
  for (const obj of placedObjects) {
    placeObjectOnGrid(obj.row, obj.col, obj.className, obj.size);
  }
}

function recalculateCounters() {
  hqCount = 0;
  bearTrapCount = 0;
  for (const obj of placedObjects) {
    if (obj.className === 'hq') hqCount++;
    if (obj.className === 'bear-trap') bearTrapCount++;
  }
}

function clearGridVisualOnly() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    tile.className = 'tile'; 
    tile.dataset.name = '';
    tile.style.border = '';
  });
}

// Place object on grid
function placeObjectOnGrid(row, col, className, size) {
  const tiles = document.querySelectorAll('.tile');
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const index = (row + r) * gridSize + (col + c);
      tiles[index].classList.add(className);
      // ensure it's not covered
      tiles[index].classList.remove('object-border-top','object-border-right','object-border-bottom','object-border-left','covered');
    }
  }
  applyObjectBorder(row, col, size);
  
  if (className === 'hq') {
    highlightTerritory(row + 1, col + 1, 7);
  } else if (className === 'banner') {
    highlightTerritory(row, col, 3);
  }
}

function clearGrid() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    tile.className = 'tile';
    tile.dataset.name = '';
  });
  currentObject = null;
  hqCount = 0;
  bearTrapCount = 0;
  placedObjects = []; // Also reset placed objects
}

function saveLayout() {
  const layoutJSON = JSON.stringify(placedObjects);
  const blob = new Blob([layoutJSON], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'layout.json';
  link.click();
  URL.revokeObjectURL(url);
}

function loadLayout(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const loadedData = JSON.parse(e.target.result);
      placedObjects = loadedData;
      recalculateCounters();
      clearGridVisualOnly();
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

// DRAG & DROP CHANGES: We re-introduce the border function (deleted above):
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
          !tiles[index].classList.contains('banner') &&
          !tiles[index].classList.contains('resource-node') &&
          !tiles[index].classList.contains('non-buildable-area')
        ) {
          tiles[index].classList.add('covered');
        }
      }
    }
  }
}

// Set the current object for *new* placement
function addObject(className, size) {
  currentObject = { className, size };
}

// Event listeners for toolbar buttons
document.getElementById('undo').addEventListener('click', undoLastPlacement);
document.getElementById('add-bear-trap').addEventListener('click', () => addObject('bear-trap', 3));
document.getElementById('add-hq').addEventListener('click', () => addObject('hq', 3));
document.getElementById('add-furnace').addEventListener('click', () => addObject('furnace', 2));
document.getElementById('add-banner').addEventListener('click', () => addObject('banner', 1));
document.getElementById('add-resource-node').addEventListener('click', () => addObject('resource-node', 2));
document.getElementById('add-non-buildable').addEventListener('click', () => addObject('non-buildable-area', 1));
document.getElementById('clear-grid').addEventListener('click', clearGrid);
document.getElementById('save-layout').addEventListener('click', saveLayout);
document.getElementById('load-layout').addEventListener('change', loadLayout);

// Initialize the grid on page load
createGrid();
