# Fleet Graph Wizard

A web-based graph editor for ROS2 fleet management. Create, edit, and export navigation graphs for robot fleet coordination.

## Features

### Map Import
- Load ROS2 map PNG files
- Import corresponding YAML files with map metadata (resolution, origin, etc.)
- View map coordinates in both canvas and world coordinate systems

### Graph Editing
- **Add Nodes**: Create waypoints, charging stations, pickup/dropoff points
- **Draw Paths**: Create directed edges between nodes with custom properties
- **Edit Properties**: Configure node and path attributes
- **Delete Elements**: Remove nodes and paths as needed

### Node Properties
- **Name**: Custom node identifier
- **Type**: Normal, Charging Station, Pickup Point, Dropoff Point
- **No Waiting**: Flag nodes where robots cannot wait
- **Parking Spot**: Mark nodes as parking locations
- **Max Robots**: Set capacity limit for simultaneous robots
- **Notes**: Additional information

### Path Properties
- **Name**: Custom path identifier
- **Speed Limit**: Maximum velocity in m/s
- **Bidirectional**: Allow travel in both directions
- **Width**: Path width in meters
- **Notes**: Additional information

### Export/Import
- **JSON Export**: Save complete graph with all nodes, paths, and metadata
- **JSON Import**: Load previously created graphs
- **World Coordinates**: Automatically converts canvas coordinates to world coordinates based on YAML metadata

## Usage

### Getting Started

1. Open [index.html](index.html) in a web browser
2. Click "Load Map (PNG + YAML)" and select your ROS2 map PNG file
3. Select the corresponding YAML file when prompted
4. Start creating your graph!

### Tools

#### Add Node
- Click anywhere on the map to create a new node
- A properties dialog will appear to configure the node
- Nodes are color-coded by type:
  - Blue: Normal waypoint
  - Green: Charging station
  - Yellow: Pickup point
  - Cyan: Dropoff point

#### Draw Path
- Click on a source node to start the path
- Click on a destination node to complete the path
- Configure path properties in the dialog
- Green arrows indicate path direction
- Bidirectional paths show arrows in both directions

#### Select/Edit
- Click on nodes or paths to edit their properties
- Modify any attribute and save changes

#### Delete
- Click on nodes or paths to remove them
- Deleting a node also removes all connected paths

### Navigation

- **Pan**: Middle-click and drag, or Ctrl+Click and drag
- **Zoom**: Mouse wheel, or use Zoom In/Zoom Out buttons
- **Reset View**: Return to default zoom and position

### Coordinate Systems

The application displays coordinates in two formats:
- **Canvas Coordinates**: Pixel coordinates on the canvas
- **World Coordinates**: Real-world coordinates in meters, calculated using the YAML file's resolution and origin

### Export Format

The exported JSON contains:
```json
{
  "metadata": {
    "version": "1.0",
    "created": "2024-01-01T12:00:00.000Z",
    "mapYaml": {
      "resolution": 0.05,
      "origin": [-10.0, -10.0, 0.0]
    }
  },
  "nodes": [
    {
      "id": "node_1",
      "name": "Node 1",
      "x": 100,
      "y": 100,
      "worldCoords": { "x": -5.0, "y": -5.0 },
      "type": "normal",
      "noWaiting": false,
      "isParkingSpot": false,
      "maxRobots": 1,
      "notes": ""
    }
  ],
  "paths": [
    {
      "id": "path_123456",
      "name": "Node 1 -> Node 2",
      "from": "node_1",
      "to": "node_2",
      "speedLimit": 1.0,
      "bidirectional": false,
      "width": 1.0,
      "notes": ""
    }
  ]
}
```

## File Structure

```
fleet_graph_wizard/
├── index.html          # Main HTML structure
├── styles.css          # Dark theme styling
├── app.js             # Core application logic
└── README.md          # This file
```

## Technologies

- **HTML5 Canvas**: For rendering the map and graph
- **JavaScript (ES6)**: Core application logic
- **js-yaml**: YAML parsing library (loaded via CDN)
- **CSS3**: Modern dark theme UI

## Browser Compatibility

Works in all modern browsers supporting:
- HTML5 Canvas API
- ES6 JavaScript
- FileReader API

## Tips

1. **Load Map First**: Always load your map PNG and YAML before creating the graph
2. **Save Often**: Export your graph regularly to avoid losing work
3. **Use Descriptive Names**: Give nodes and paths meaningful names for easier management
4. **Check World Coordinates**: Verify that world coordinates match your expectations based on the map
5. **Bidirectional Paths**: Use bidirectional flag instead of creating two separate paths

## Future Enhancements

Potential features for future versions:
- Undo/Redo functionality
- Grid snapping
- Path waypoints (curved paths)
- Multi-select and bulk operations
- Graph validation
- Direct integration with ROS2 fleet management systems
- Path cost/weight attributes
- Zone definitions
- Traffic rules configuration

## License

MIT License - Feel free to use and modify for your fleet management needs!
