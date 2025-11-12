# Fleet Graph Wizard - Complete User Guide

A comprehensive web-based graph editor for ROS2 fleet management. Create, edit, and export navigation graphs with visual feedback for robot fleet coordination.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Loading Maps](#loading-maps)
4. [Working with Nodes](#working-with-nodes)
5. [Working with Paths](#working-with-paths)
6. [Visual Features](#visual-features)
7. [Selection and Editing](#selection-and-editing)
8. [Advanced Features](#advanced-features)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Export and Import](#export-and-import)
11. [Tips and Best Practices](#tips-and-best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Quick Start

1. **Open the Application**
   - Open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari)
   - The application requires no installation or server setup

2. **Load Your Map**
   - Click the "Load Map" button
   - Select your ROS2 map files (.pgm and .yaml)
   - The map will appear on the canvas with proper scaling

3. **Create Your Graph**
   - Add nodes by clicking on the map
   - Connect nodes with paths
   - Configure properties as needed
   - Export your completed graph

### System Requirements

- **Browser**: Modern browser with ES6 support
- **Files Needed**:
  - Map image (.pgm or .png)
  - Map metadata (.yaml)
- **No Server Required**: Runs entirely in the browser

---

## Interface Overview

### Toolbar Sections

#### 📁 Files
- **Load Map**: Import ROS2 map files (PNG/PGM + YAML)
- **Recent**: Quick access to recently loaded maps
- **Import**: Load previously saved graph JSON
- **Export**: Save graph as JSON file
- **Search**: Find nodes and paths by name

#### 🛠️ Tools
- **+ Node** (N): Add waypoint nodes to the map
- **+ Path** (P): Create directed paths between nodes
- **Select** (E): Select and drag nodes, edit properties
- **Delete** (D): Remove nodes or paths
- **Measure** (M): Measure distances between points

#### ✏️ Edit
- **↔ H**: Align selected nodes horizontally
- **↕ V**: Align selected nodes vertically
- **⊞ Grid**: Align selected nodes to grid
- **Bulk**: Edit multiple nodes at once
- **✓ Validate**: Check graph for errors

#### 👁️ View
- **+ Zoom** / **- Zoom**: Zoom in/out
- **Reset**: Reset view to 100%
- **Fit All**: Fit all nodes in view
- **Focus**: Center on selected nodes

### Side Panels

#### Properties Panel (Right)
- Shows node/path properties when selected
- Double-click any element to edit inline
- Real-time updates as you type
- Apply or Cancel changes

#### Visualization Controls (Bottom Right)
- **Path**: Toggle lines and names
- **Node**: Toggle points and names
- **View**: Toggle grid and minimap
- **Grid Size**: Adjust grid spacing (in meters)

#### Minimap (Bottom Right Corner)
- Overview of entire map
- Shows current viewport
- Click to jump to location

---

## Loading Maps

### Supported Formats

**Map Images:**
- `.pgm` (Portable Graymap - standard ROS2 format)
- `.png` (Portable Network Graphics)

**Metadata:**
- `.yaml` (ROS2 map metadata)

### YAML Requirements

Your YAML file must contain:
```yaml
image: map.pgm           # Image filename
resolution: 0.05         # meters per pixel
origin: [-10.0, -10.0, 0.0]  # Map origin in world coordinates
negate: 0
occupied_thresh: 0.65
free_thresh: 0.196
```

### Loading Process

1. Click **Load Map** button
2. Select map files (both .pgm/.png and .yaml)
3. Map appears automatically scaled
4. Status bar shows "Map loaded successfully"

### Recent Maps

- Application remembers recently loaded maps
- Click **Recent ▼** to see list
- Click any recent map to reload instantly

---

## Working with Nodes

### Creating Nodes

1. **Select Node Tool** (click "+ Node" or press `N`)
2. **Click on Map** where you want the node
3. **Configure Properties** in the modal that appears:
   - **Name**: Unique identifier (e.g., "Warehouse_A")
   - **Type**: Normal, Charging Station, Pickup Point, Dropoff Point
   - **No Waiting**: Check if robots cannot stop here
   - **Parking Spot**: Mark as parking location
   - **Max Robots**: Capacity limit (default: 1)
   - **Notes**: Additional information
4. **Click Save** to create the node

### Node Types and Icons

Nodes display visual icons based on their properties:

| Type | Icon | Position | Color |
|------|------|----------|-------|
| Charging Station | ⚡ Lightning | Top | Green |
| Pickup Point | ↑ Arrow Up | Right | Yellow |
| Dropoff Point | ↓ Arrow Down | Left | Cyan |
| Parking Spot | P Letter | Bottom | Gray |
| No Waiting | ⊘ Diagonal | Diagonal | Red |

**Icon Features:**
- All nodes are blue for consistency
- Icons appear around nodes, not changing node color
- Multiple icons can appear on same node
- Icons are drawn above names for visibility
- Intelligent positioning prevents overlap

### Node Properties

#### Basic Properties
- **Name**: Must be unique within the graph
- **Position**: Automatically set, shown in canvas and world coordinates
- **Type**: Determines the icon displayed

#### Advanced Properties
- **No Waiting**: Robots cannot pause at this location (shows red ⊘ icon)
- **Parking Spot**: Designated parking area (shows gray P icon)
- **Max Robots**: Maximum simultaneous occupancy (default: 1)
- **Notes**: Free-form text for documentation

### Editing Nodes

**Single Click (in Select mode):**
- Selects the node
- Shows yellow highlight
- Status bar shows: "Selected node: [name]. Double-click to edit properties."

**Double Click:**
- Opens properties panel on right side
- Edit properties inline
- Click "Apply" to save changes
- Click "Cancel" to discard

**Dragging:**
- In Select mode, click and drag to move nodes
- Hold Shift while dragging to maintain selection
- Snap to grid if enabled

### Deleting Nodes

1. **Select Delete Tool** (click "Delete" or press `D`)
2. **Click on Node** to delete
3. **Confirmation**: Node and all connected paths are removed

---

## Working with Paths

### Creating Paths

1. **Select Path Tool** (click "+ Path" or press `P`)
2. **Click Source Node** (path start)
3. **Move Mouse** to see preview line
4. **Click Destination Node** (path end)
5. **Configure Properties** in the modal:
   - **Name**: Path identifier (auto-generated: "Node1 -> Node2")
   - **Speed Limit**: Maximum velocity in m/s (default: 1.0)
   - **Bidirectional**: Allow travel both ways
   - **Width**: Path width in meters (default: 1.0)
   - **Notes**: Additional information
6. **Click Save** to create the path

### Path Visual Features

#### Animated Direction Arrows
- **Moving Arrows**: Show direction of travel
- **Speed-Based Animation**: Arrow speed matches path speed limit
  - 1.0 m/s = normal speed
  - 2.0 m/s = 2x faster arrows
  - 0.5 m/s = 2x slower arrows
- **Multiple Arrows**: Spaced along longer paths
- **Bidirectional**: Arrows move in both directions

#### Path Colors
- **Normal**: Green (#00ff00)
- **Selected**: Yellow (#ffff00)
- **Hovered**: White glow

#### Path Width
- Visual line width scales with path width property
- Wider paths appear thicker on screen
- Helps identify main corridors vs narrow passages

### Path Properties

#### Basic Properties
- **Name**: Descriptive identifier
- **From/To**: Source and destination nodes (read-only in edit mode)
- **Speed Limit**: Maximum robot velocity (m/s)
- **Width**: Physical path width (meters)

#### Advanced Properties
- **Bidirectional**: Creates two-way travel
  - More efficient than creating two separate paths
  - Shows arrows in both directions
  - Single property to manage
- **Notes**: Documentation and constraints

### Editing Paths

**Single Click (in Select mode):**
- Selects the path
- Shows yellow highlight
- Status bar shows: "Selected path: [name]. Double-click to edit properties."

**Double Click:**
- Opens properties panel on right side
- Edit properties inline
- Click "Apply" to save
- Click "Cancel" to discard

**Click Detection:**
- 20-pixel tolerance around path line
- Easy to select even thin paths
- Works at any zoom level

### Deleting Paths

1. **Select Delete Tool** (press `D`)
2. **Click on Path** to delete
3. **Confirmation**: Path is removed
4. **Nodes Remain**: Only the path is deleted

---

## Visual Features

### Grid System

#### Map-Frame Aligned Grid
- Grid aligns with map's world coordinate system
- Grid lines represent real-world distances
- Origin point (0,0) is properly aligned
- Grid spacing adjustable in meters

#### Using the Grid

1. **Toggle Grid**: Check "Grid" in visualization controls (or press `G`)
2. **Set Grid Size**: Enter spacing in meters (default: 1.0m)
   - 0.5m = fine grid for precise placement
   - 1.0m = standard meter grid
   - 5.0m = coarse grid for large areas
3. **Snap to Grid**: Press `S` to toggle snap mode
   - Nodes auto-align when placed
   - Nodes auto-align when dragged
4. **Align to Grid**: Select nodes and press "⊞ Grid" button
   - Snaps existing nodes to nearest grid points
   - Works in bulk on multiple nodes

### Coordinate Systems

The application displays two coordinate systems simultaneously:

#### Canvas Coordinates
- Pixel positions on the canvas
- Origin: top-left corner (0, 0)
- Used internally for rendering
- Shown in status bar when hovering

#### World Coordinates
- Real-world positions in meters
- Based on YAML map origin and resolution
- Shown in properties panels
- Used in exported JSON
- Aligned with ROS2 coordinate system

**Conversion Formula:**
```
world_x = (canvas_x * resolution) + origin_x
world_y = ((map_height - canvas_y) * resolution) + origin_y
```

### Minimap

Located in bottom-right corner:
- **Overview**: Shows entire map at once
- **Viewport**: White rectangle shows current view
- **Navigation**: Click to jump to location
- **Toggle**: Checkbox in visualization controls
- **Size**: Fixed 200x200 pixels

### Tooltips

Hover over elements to see tooltips:
- **Nodes**: Name, type, position, max robots
- **Paths**: Name, speed, width, direction
- **Appears After**: 500ms hover delay
- **Auto-Hide**: When mouse moves away

---

## Selection and Editing

### Single Selection

**Nodes:**
1. Select tool active (press `E`)
2. Click on node
3. Yellow highlight appears
4. Double-click to edit properties

**Paths:**
1. Select tool active
2. Click on path (20px tolerance)
3. Yellow highlight appears
4. Double-click to edit properties

### Multi-Selection

**Add to Selection:**
- Hold `Shift` + Click on additional nodes
- Each selected node shows yellow highlight
- Purple dot indicates multi-select mode

**Remove from Selection:**
- Hold `Shift` + Click on selected node
- Node is deselected
- Others remain selected

**Selection Box:**
- Hold `Shift` + Drag on empty area
- Rectangle appears
- All nodes within box are selected

**Select All:**
- Press `Ctrl+A` to select all nodes

### Bulk Operations

#### Bulk Edit Properties
1. **Multi-select** nodes
2. **Click "Bulk" button** (or press `B`)
3. **Choose properties** to apply:
   - Node Type: Apply to all selected
   - No Waiting: Set for all
   - Parking Spot: Set for all
   - Max Robots: Set for all
4. **Click "Apply to All"**

#### Alignment Tools

**Horizontal Alignment** (`H`):
- Aligns selected nodes to average Y position
- Maintains X positions
- Creates horizontal row

**Vertical Alignment** (`V`):
- Aligns selected nodes to average X position
- Maintains Y positions
- Creates vertical column

**Grid Alignment** (⊞):
- Snaps each node to nearest grid point
- Uses map-frame aligned grid
- Preserves relative positions

### Copy and Paste

**Copy** (`Ctrl+C`):
- Copies selected nodes
- Includes all properties
- Does not copy paths

**Paste** (`Ctrl+V`):
- Pastes at current mouse position
- Creates new node IDs
- Preserves all properties
- Paths are not duplicated

### Undo and Redo

**Undo** (`Ctrl+Z`):
- Reverts last action
- 50 action history
- Includes: add, delete, move, edit

**Redo** (`Ctrl+Y`):
- Re-applies undone action
- Follows undo history
- Clears on new action

---

## Advanced Features

### Graph Validation

**Run Validation** (press `T`):
1. Click "✓ Validate" button
2. Modal shows validation results

**Checks Performed:**

#### Disconnected Nodes
- Nodes with no incoming or outgoing paths
- Warning level
- Lists all disconnected nodes

#### Overlapping Nodes
- Nodes within 10 pixels of each other
- Warning level
- Lists pairs of overlapping nodes

#### Duplicate Paths
- Multiple paths between same node pair
- Warning level (may be intentional for bidirectional)
- Lists duplicate pairs

#### Duplicate Names
- Multiple nodes or paths with same name
- Warning level
- Lists duplicate names

**Validation Results:**
- ✅ Green: No issues found
- ⚠️ Yellow: Warnings (may be intentional)
- ❌ Red: Critical errors (currently none defined)

### Measurement Tool

**Measure Distances:**
1. Select Measure tool (press `M`)
2. Click first point
3. Move mouse (see preview line)
4. Click second point
5. Distance appears in both:
   - Pixels (if no map loaded)
   - Meters (if map with YAML loaded)

**Use Cases:**
- Verify path lengths
- Check spacing between nodes
- Plan new node placement
- Validate map scale

### Search Functionality

**Search Box** (top toolbar):
1. Click search box or press `Ctrl+F`
2. Type node or path name
3. Results filter in real-time
4. Click result to select and focus

**Search Features:**
- Case-insensitive
- Partial matching
- Searches both nodes and paths
- Highlights matches
- Auto-focuses on selection

### Context Menu

**Right-Click** on node or empty space:
- **Node Context**: Edit, Delete, Set as Start/End
- **Empty Space**: Add Node Here, Paste (if copied)
- **Quick Actions**: Faster than toolbar buttons

---

## Keyboard Shortcuts

### General
| Key | Action |
|-----|--------|
| `ESC` | Cancel operation / Clear selection / Close modals |
| `K` | Toggle shortcuts overlay |
| `?` or `F1` | Show full help |
| `Ctrl+F` | Focus search box |

### Tools
| Key | Action |
|-----|--------|
| `N` | Add Node tool |
| `P` | Draw Path tool |
| `E` | Select/Edit tool |
| `D` | Delete tool |
| `M` | Measure tool |

### Edit Operations
| Key | Action |
|-----|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+C` | Copy selected nodes |
| `Ctrl+V` | Paste nodes |
| `Ctrl+A` | Select all nodes |
| `Delete` | Delete selected |
| `H` | Align Horizontal |
| `V` | Align Vertical |
| `B` | Bulk Edit |
| `T` | Validate Graph |

### View Controls
| Key | Action |
|-----|--------|
| `G` | Toggle grid |
| `S` | Toggle snap to grid |
| `Ctrl+Drag` | Pan view |
| `Middle Click+Drag` | Pan view |
| `Mouse Wheel` | Zoom in/out |

### Selection
| Key | Action |
|-----|--------|
| `Shift+Click` | Add to selection |
| `Shift+Drag` | Selection box |

---

## Export and Import

### Exporting Graphs

**Export to JSON:**
1. Click "Export" button
2. File downloads automatically as `fleet_graph.json`
3. Contains complete graph data

**Export Format:**
```json
{
  "metadata": {
    "version": "1.0",
    "created": "2025-01-15T10:30:00.000Z",
    "mapYaml": {
      "image": "map.pgm",
      "resolution": 0.05,
      "origin": [-10.0, -10.0, 0.0],
      "negate": 0,
      "occupied_thresh": 0.65,
      "free_thresh": 0.196
    }
  },
  "nodes": [
    {
      "id": "node_1",
      "name": "Warehouse A",
      "x": 245.5,
      "y": 180.2,
      "worldCoords": {
        "x": 2.275,
        "y": 1.510
      },
      "type": "charging",
      "noWaiting": false,
      "isParkingSpot": true,
      "maxRobots": 2,
      "notes": "Main charging station"
    }
  ],
  "paths": [
    {
      "id": "path_1234567890",
      "name": "Warehouse A -> Pickup Zone",
      "from": "node_1",
      "to": "node_2",
      "speedLimit": 2.5,
      "bidirectional": true,
      "width": 1.5,
      "notes": "Main corridor"
    }
  ]
}
```

**Exported Data Includes:**
- Map metadata (if loaded)
- All nodes with properties
- All paths with properties
- World coordinates
- Creation timestamp
- Version information

### Importing Graphs

**Import from JSON:**
1. Click "Import" button
2. Select previously exported `.json` file
3. Graph loads automatically

**Import Behavior:**
- **Replaces Current**: Clears existing graph
- **Preserves Map**: Keeps currently loaded map
- **Validates Format**: Checks JSON structure
- **Error Handling**: Shows alert if invalid

**Compatibility:**
- Imports graphs created by this application
- Validates node and path IDs
- Handles missing optional properties
- Backwards compatible with older versions

### File Management

**Best Practices:**
1. **Regular Saves**: Export frequently during editing
2. **Version Control**: Include version/date in filename
   - Example: `warehouse_v1_2025-01-15.json`
3. **Backup Maps**: Keep YAML and image files together
4. **Documentation**: Use Notes fields for important info

---

## Tips and Best Practices

### Planning Your Graph

1. **Start with Landmarks**
   - Identify key locations first
   - Mark charging stations, loading docks, storage areas
   - Use descriptive names

2. **Create Main Corridors**
   - Connect major areas first
   - Use higher speed limits for main routes
   - Set appropriate path widths

3. **Add Detail Gradually**
   - Fill in secondary paths
   - Add parking spots near destinations
   - Set no-waiting zones as needed

4. **Test Connectivity**
   - Run validation regularly
   - Ensure all nodes are reachable
   - Check for dead ends

### Naming Conventions

**Nodes:**
- Use clear, descriptive names
- Include area/zone: `Storage_A1`, `Dock_B2`
- Indicate function: `Charger_Main`, `Pickup_North`

**Paths:**
- Auto-generated names work well
- Customize for special routes
- Include direction if important: `MainCorridor_East`

### Grid Usage

**When to Use Grid:**
- ✅ Structured warehouse layouts
- ✅ Regular spacing requirements
- ✅ Alignment with real-world features
- ❌ Organic/irregular spaces
- ❌ Matching existing map features

**Grid Size Selection:**
- **0.5m**: Tight spaces, precise placement
- **1.0m**: Standard warehouses, general use
- **2.0m**: Large facilities, rough layout
- **5.0m**: Planning phase, macro layout

### Performance Tips

**Large Graphs (100+ nodes):**
- Turn off path names when editing
- Use minimap for navigation
- Disable grid when not needed
- Export regularly (browser memory)

**Visual Clarity:**
- Toggle node/path visibility as needed
- Use zoom effectively
- Filter with search when finding specific elements

### Common Workflows

#### Adding a New Zone

1. Zoom to area
2. Enable grid (appropriate size)
3. Enable snap to grid
4. Place nodes systematically
5. Connect with paths
6. Set properties in bulk
7. Validate connections

#### Modifying Existing Graph

1. Load graph JSON
2. Load corresponding map
3. Search for area/nodes to modify
4. Make changes
5. Validate graph
6. Export updated version

#### Creating Bidirectional Network

1. Place all nodes first
2. Create paths in one pass
3. Select paths in groups
4. Double-click to edit
5. Enable bidirectional
6. Set consistent speed limits

---

## Troubleshooting

### Map Loading Issues

**Problem: Map doesn't appear**
- ✅ Check YAML file is valid
- ✅ Verify image path in YAML matches filename
- ✅ Ensure both files are in same directory
- ✅ Check browser console for errors

**Problem: Map appears distorted**
- ✅ Verify resolution in YAML is correct
- ✅ Check origin values
- ✅ Try reloading the map

**Problem: Coordinates seem wrong**
- ✅ Verify YAML origin is correct
- ✅ Check resolution value
- ✅ Confirm map orientation

### Node Issues

**Problem: Can't select node**
- ✅ Ensure Select tool is active (press `E`)
- ✅ Node might be underneath another - zoom in
- ✅ Click directly on node circle

**Problem: Node dragging not working**
- ✅ Select tool must be active
- ✅ Click and hold on node, then drag
- ✅ Check if node is locked (currently no lock feature)

**Problem: Icons overlapping**
- ✅ This is by design if node has many properties
- ✅ Icons are positioned to minimize overlap
- ✅ Consider if all properties are necessary

### Path Issues

**Problem: Can't select path**
- ✅ Click directly on path line (20px tolerance)
- ✅ Zoom in for better precision
- ✅ Ensure Select tool is active
- ✅ Try clicking middle of path, not near nodes

**Problem: Arrows not animating**
- ✅ Arrows animate automatically
- ✅ Check browser performance
- ✅ Refresh page if animation freezes

**Problem: Can't see path direction**
- ✅ Ensure path lines are enabled
- ✅ Look for moving arrows
- ✅ Zoom in to see arrows better
- ✅ Check if speed limit is very low (slow arrows)

### Grid Issues

**Problem: Grid doesn't align with map**
- ✅ Grid aligns with world coordinates from YAML
- ✅ Verify YAML origin is correct
- ✅ Check that map loaded properly

**Problem: Snap to grid not working**
- ✅ Press `S` to enable snap mode
- ✅ Check status bar for "Snap to Grid: ON"
- ✅ Grid must be enabled (press `G`)

### Performance Issues

**Problem: Application running slowly**
- ✅ Reduce number of visible elements
- ✅ Turn off path names
- ✅ Disable grid when not needed
- ✅ Close other browser tabs
- ✅ Export and reload graph

**Problem: Browser freezes**
- ✅ Check number of nodes/paths (500+ may be slow)
- ✅ Disable animation temporarily
- ✅ Use more powerful device
- ✅ Clear browser cache

### Export/Import Issues

**Problem: Export doesn't download**
- ✅ Check browser download settings
- ✅ Disable popup blockers
- ✅ Try different browser

**Problem: Import fails**
- ✅ Verify JSON file is not corrupted
- ✅ Check file was created by this application
- ✅ Ensure file has .json extension
- ✅ Check browser console for error details

**Problem: Imported graph looks wrong**
- ✅ Load same map that was used during export
- ✅ Check YAML parameters match
- ✅ Verify world coordinates are preserved

---

## FAQ

### Can I use this without ROS2?
Yes! The application works with any PNG image. You can create a simple YAML file manually:
```yaml
image: your_map.png
resolution: 0.05  # adjust to your scale
origin: [0.0, 0.0, 0.0]
```

### How do I integrate this with ROS2?
The exported JSON contains world coordinates that match ROS2 conventions. You'll need to write a converter for your specific fleet management system.

### Can I edit the JSON file manually?
Yes! The JSON format is human-readable. Just maintain the structure and ensure:
- Node IDs are unique
- Path from/to reference valid node IDs
- All required fields are present

### What's the maximum graph size?
Browser-dependent, but tested with:
- ✅ 500 nodes, 1000 paths: Works well
- ⚠️ 1000+ nodes: May be slow
- ❌ 5000+ nodes: Not recommended

### Can I have multiple graphs for the same map?
Yes! Export different JSON files for different scenarios:
- `warehouse_day_shift.json`
- `warehouse_night_shift.json`
- `warehouse_maintenance.json`

### How do I share my graph with others?
Export the JSON and share:
1. The JSON file
2. The map image (.pgm/.png)
3. The YAML file

All three files needed for complete reconstruction.

---

## Support and Contributing

### Getting Help

- **Issues**: Report bugs or request features
- **Documentation**: Refer to this guide
- **Examples**: Check example graphs in the repository

### Version Information

Current Version: 1.0
Last Updated: 2025-01-15

### License

MIT License - Free to use and modify for your fleet management needs!

---

*Happy Graph Building! 🤖🗺️*
