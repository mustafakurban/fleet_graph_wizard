# Fleet Graph Wizard - Architecture

## Overview

The application has been refactored into a modular architecture with clear separation of concerns. The monolithic `app.js` (3000+ lines) has been separated into specialized manager classes.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         index.html                              │
│                      (User Interface)                           │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        app.js                                    │
│                   (Main Controller)                              │
│  - Coordinates between managers                                 │
│  - Event handling                                               │
│  - Application lifecycle                                        │
└─┬───────┬───────────┬───────────┬──────────────────────────────┘
  │       │           │           │
  │       │           │           │
  ▼       ▼           ▼           ▼
┌─────┐ ┌──────┐ ┌───────┐ ┌─────────────┐
│ Map │ │Graph │ │ View  │ │   Parsers   │
│ Mgr │ │ Mgr  │ │ Mgr   │ │   System    │
└─────┘ └──────┘ └───────┘ └─────────────┘
```

## Components

### 1. MapManager (`src/MapManager.js`)

**Purpose:** Handle all map-related operations

**Responsibilities:**
- Load map files (PNG/PGM + YAML)
- Manage map image and metadata
- Coordinate transformations (canvas ↔ world coordinates)
- Map rendering
- Recent files management

**Key Methods:**
```javascript
- loadMapFiles(files)                    // Load map image + YAML
- loadImageFile(file)                    // Load and parse image
- getWorldCoordinates(x, y)              // Canvas → World coords
- getCanvasCoordinates(x, y)             // World → Canvas coords
- getMapInfoString()                     // Get display info
- isMapLoaded()                          // Check if map exists
- getMapResolution()                     // Get meters/pixel
- render(ctx)                            // Render map on canvas
```

**State:**
```javascript
- mapImage      // Loaded map image
- mapYaml       // Map metadata (resolution, origin, etc.)
- recentFiles   // Recent map files list
```

---

### 2. GraphManager (`src/GraphManager.js`)

**Purpose:** Handle all graph operations (nodes and paths)

**Responsibilities:**
- Manage nodes (CRUD operations)
- Manage paths (CRUD operations)
- Selection management
- Graph validation
- Import/Export
- Undo/Redo history
- Clipboard operations
- Search functionality

**Key Methods:**
```javascript
// Node operations
- addNode(nodeData)                      // Create node
- updateNode(nodeId, updates)            // Update node
- deleteNode(nodeId)                     // Delete node
- getNode(nodeId)                        // Get node by ID
- getNodes()                             // Get all nodes

// Path operations
- addPath(pathData)                      // Create path
- updatePath(pathId, updates)            // Update path
- deletePath(pathId)                     // Delete path
- getPath(pathId)                        // Get path by ID
- getPaths()                             // Get all paths

// Import/Export
- importGraph(file)                      // Import graph file
- exportToJSON(getWorldCoords, mapYaml)  // Export to JSON
- loadGraphData(data)                    // Load standardized data

// History
- saveState()                            // Save to history
- undo()                                 // Undo last action
- redo()                                 // Redo action

// Selection
- selectNode(nodeId)                     // Select single node
- selectPath(pathId)                     // Select single path
- selectMultipleNodes(nodeIds)           // Multi-select
- clearSelection()                       // Clear all selections
- getSelection()                         // Get current selection

// Validation & Search
- validateGraph()                        // Check for errors
- search(query)                          // Search nodes/paths

// Clipboard
- copySelectedNodes()                    // Copy to clipboard
- pasteNodes(offsetX, offsetY)           // Paste from clipboard
```

**State:**
```javascript
- nodes               // Array of nodes
- paths               // Array of paths
- selectedNode        // Currently selected node
- selectedPath        // Currently selected path
- selectedNodes       // Multi-selected nodes
- selectedPaths       // Multi-selected paths
- nodeCounter         // ID generator
- history             // Undo/redo stack
- historyIndex        // Current position in history
- clipboard           // Copied data
- searchResults       // Search results
- availableParsers    // Registered parsers
- currentParser       // Active parser
```

---

### 3. ViewManager (`src/ViewManager.js`)

**Purpose:** Handle canvas rendering and view controls

**Responsibilities:**
- Canvas setup and management
- Pan and zoom controls
- Grid rendering
- Minimap rendering
- Node and path visualization
- Selection highlighting
- Animation loop

**Key Methods:**
```javascript
// Canvas & Transform
- setupCanvas()                          // Initialize canvas
- clear()                                // Clear canvas
- applyTransform()                       // Apply view transform
- restoreTransform()                     // Restore transform
- screenToCanvas(x, y)                   // Screen → Canvas coords
- canvasToScreen(x, y)                   // Canvas → Screen coords

// View Control
- pan(dx, dy)                            // Pan view
- zoomAt(x, y, delta)                    // Zoom at point
- resetView()                            // Reset to default
- fitAll(nodes, mapDims)                 // Fit all content
- focusOnNodes(nodes)                    // Focus on selection

// Grid
- updateGrid(mapResolution)              // Update grid size
- snapToGridCoord(x, y)                  // Snap to grid
- drawGrid(ctx, mapDims)                 // Render grid

// Rendering
- drawNode(node, selected, hovered)      // Draw node
- drawPath(path, from, to, sel, hov)     // Draw path
- drawNodeIcons(node, radius)            // Draw node icons
- drawArrow(from, to, speed)             // Draw direction arrow
- drawMinimap(map, nodes, view)          // Draw minimap

// Settings
- setDisplayOption(option, value)        // Toggle display options
- getZoomPercentage()                    // Get zoom level
- startAnimationLoop(callback)           // Start animation
```

**State:**
```javascript
- canvas              // Main canvas element
- ctx                 // 2D context
- minimapCanvas       // Minimap canvas
- minimapCtx          // Minimap context
- offset              // View offset {x, y}
- scale               // Zoom scale
- showPathLines       // Display flag
- showPathNames       // Display flag
- showNodePoints      // Display flag
- showNodeNames       // Display flag
- showGrid            // Display flag
- showMinimap         // Display flag
- gridSize            // Grid size (pixels)
- gridSizeMeters      // Grid size (meters)
- snapToGrid          // Snap enabled
- animationTime       // Animation timestamp
- selectedNodePulse   // Pulsing animation value
- hoveredNode         // Hovered node
- hoveredPath         // Hovered path
```

---

### 4. Parser System (`parsers/`)

**Purpose:** Extensible import system for different graph formats

**Components:**
- `BaseParser.js` - Abstract base class
- `JSONParser.js` - Native format parser
- `CSVParser.js` - CSV format parser
- `index.js` - Parser registry

See [PARSER_SYSTEM.md](PARSER_SYSTEM.md) for details.

---

### 5. Main Application (`app.js`)

**Purpose:** Coordinate managers and handle user interactions

**Responsibilities:**
- Initialize all managers
- Set up event listeners
- Coordinate between managers
- Handle UI updates
- Manage application state
- Tool switching
- Modal management

**Structure:**
```javascript
class FleetGraphWizard {
    constructor() {
        // Initialize managers
        this.mapManager = new MapManager();
        this.graphManager = new GraphManager();
        this.viewManager = new ViewManager(canvas, minimapCanvas);

        // Application state
        this.currentTool = 'node';
        this.isDragging = false;
        // ...
    }

    init() {
        // Setup event listeners
        // Initialize parsers
        // Start rendering
    }

    // Coordinate operations between managers
    render() {
        this.viewManager.clear();
        this.viewManager.applyTransform();

        // Render map
        this.mapManager.render(this.viewManager.ctx);

        // Render graph
        this.graphManager.getNodes().forEach(node => {
            this.viewManager.drawNode(node, ...);
        });

        this.viewManager.restoreTransform();
    }
}
```

---

## Data Flow

### Example: Importing a Graph

```
1. User clicks Import button
   └─> app.js: Handle button click

2. app.js calls graphManager
   └─> graphManager.importGraph(file)

3. GraphManager uses parser
   └─> currentParser.parse(fileContent)

4. Parser returns standardized format
   └─> { metadata, nodes, paths }

5. GraphManager loads data
   └─> graphManager.loadGraphData(data)

6. app.js triggers render
   └─> render() displays new graph
```

### Example: Loading a Map

```
1. User selects map files
   └─> app.js: Handle file input

2. app.js calls mapManager
   └─> mapManager.loadMapFiles(files)

3. MapManager parses YAML
   └─> jsyaml.load(yamlContent)

4. MapManager loads image
   └─> mapManager.loadImageFile(imageFile)

5. Map ready
   └─> mapManager.isMapLoaded() === true

6. app.js triggers render
   └─> viewManager renders map
```

### Example: Adding a Node

```
1. User clicks on canvas (node tool active)
   └─> app.js: Handle canvas click

2. app.js converts coordinates
   └─> viewManager.screenToCanvas(mouseX, mouseY)

3. Optional: Snap to grid
   └─> viewManager.snapToGridCoord(x, y)

4. app.js creates node
   └─> graphManager.addNode({ x, y, ... })

5. GraphManager saves state
   └─> graphManager.saveState() (for undo)

6. app.js triggers render
   └─> viewManager.drawNode(node)
```

---

## Benefits of This Architecture

### 1. **Separation of Concerns**
Each manager has a single, well-defined responsibility:
- MapManager: Maps only
- GraphManager: Graph data only
- ViewManager: Rendering only
- app.js: Coordination only

### 2. **Maintainability**
- Easier to find and fix bugs
- Changes are localized
- Each file is ~300-500 lines (vs 3000+ before)

### 3. **Testability**
- Each manager can be tested independently
- Mock dependencies easily
- Unit tests are straightforward

### 4. **Extensibility**
- Add new features without touching other components
- New managers can be added easily
- Parser system is already extensible

### 5. **Reusability**
- Managers can be used in other projects
- Clear APIs for each component
- No tight coupling

### 6. **Readability**
- Smaller files are easier to understand
- Clear interfaces between components
- Self-documenting structure

---

## File Structure

```
fleet_graph_wizard/
├── index.html                  # Main HTML
├── app.js                      # Main application controller
├── styles.css                  # Styles
│
├── src/                        # Manager classes
│   ├── MapManager.js          # Map operations
│   ├── GraphManager.js        # Graph operations
│   └── ViewManager.js         # Rendering & view controls
│
├── parsers/                    # Parser system
│   ├── BaseParser.js          # Base class
│   ├── JSONParser.js          # JSON parser
│   ├── CSVParser.js           # CSV parser
│   ├── index.js               # Parser registry
│   └── README.md              # Parser documentation
│
├── example_graph.json         # Example files
├── example_graph.csv
├── example_map.yaml
│
└── docs/                       # Documentation
    ├── ARCHITECTURE.md        # This file
    ├── PARSER_SYSTEM.md       # Parser system docs
    ├── PARSER_QUICKSTART.md   # Quick start guide
    ├── README.md              # Project README
    └── USER_GUIDE.md          # User guide
```

---

## Migration Guide

### From Old app.js to New Architecture

**Old:**
```javascript
// Everything in app.js
this.mapImage = ...;
this.nodes = [];
this.scale = 1;
// 3000+ lines...
```

**New:**
```javascript
// In app.js
this.mapManager = new MapManager();
this.graphManager = new GraphManager();
this.viewManager = new ViewManager(canvas, minimap);

// Use managers
this.mapManager.loadMapFiles(files);
this.graphManager.addNode(data);
this.viewManager.zoomAt(x, y, delta);
```

### Adding New Features

**Before:** Find the right place in 3000 lines of code

**After:** Add to the appropriate manager
- Map feature → MapManager
- Graph feature → GraphManager
- Rendering feature → ViewManager
- New parser → parsers/ directory

---

## Performance Considerations

### Rendering Optimization
- ViewManager handles all canvas operations
- Efficient transform management
- Minimap uses scaled rendering
- Animation loop runs at 60 FPS

### Memory Management
- History limited to 50 states
- Recent files limited to 10 entries
- LocalStorage for persistence
- Proper cleanup on file loads

### Scalability
- Handles large graphs (1000+ nodes)
- Efficient search with filtering
- Grid snapping optimized
- Path hit detection optimized

---

## Future Enhancements

Potential improvements with this architecture:

1. **Add StateManager**
   - Centralized state management
   - Redux-like pattern
   - Better undo/redo

2. **Add ToolManager**
   - Separate tool logic
   - Tool plugins
   - Custom tools

3. **Add ValidationManager**
   - Complex validation rules
   - Real-time validation
   - Custom validators

4. **Add ExportManager**
   - Multiple export formats
   - Format converters
   - Export templates

5. **Add LayerManager**
   - Multi-floor support
   - Layer visibility
   - Layer-based rendering

---

## Summary

The refactored architecture provides:

✅ **Clear separation**: Map, Graph, View managers
✅ **Maintainable**: Smaller, focused files
✅ **Extensible**: Easy to add features
✅ **Testable**: Independent components
✅ **Documented**: Clear interfaces and responsibilities
✅ **Scalable**: Handles complex graphs efficiently

The application is now easier to understand, modify, and extend while maintaining all existing functionality.
