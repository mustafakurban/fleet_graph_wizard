# Fleet Graph Wizard - Parser Development Guide

This guide explains how to create custom graph importers for Fleet Graph Wizard.

## Overview

The parser system allows you to import graphs from different formats (CSV, XML, custom formats, etc.) while maintaining a unified internal representation. All parsers convert their input to a standardized graph format that the application uses.

## Architecture

```
┌─────────────────────┐
│  User's File        │
│  (Any Format)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Custom Parser      │
│  (Your Code)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Standard Format    │
│  { nodes, paths }   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Fleet Graph Wizard │
│  (Application)      │
└─────────────────────┘
```

## Standard Graph Format

All parsers must output this standardized format:

```javascript
{
    metadata: {
        version: "1.0",
        created: "2025-01-15T10:30:00.000Z",
        mapYaml: { /* optional ROS2 map config */ },
        // ... any custom metadata
    },
    nodes: [
        {
            id: "node_1",           // Required: Unique identifier
            name: "Entrance",       // Required: Display name
            x: 5.0,                 // Required: X coordinate (meters)
            y: 3.2,                 // Required: Y coordinate (meters)
            type: "normal",         // Required: 'normal', 'charging', 'pickup', 'dropoff'
            maxRobots: 1,           // Optional: Max robots at node (default: 1)
            parkingSpot: false,     // Optional: Is parking spot (default: false)
            noWaiting: false        // Optional: No waiting allowed (default: false)
        },
        // ... more nodes
    ],
    paths: [
        {
            id: "path_1",           // Required: Unique identifier
            name: "Main Corridor",  // Optional: Display name
            from: "node_1",         // Required: Source node ID
            to: "node_2",           // Required: Target node ID
            bidirectional: true,    // Optional: Two-way path (default: false)
            speedLimit: 1.5,        // Optional: Speed limit in m/s
            width: 0.8              // Optional: Path width in meters
        },
        // ... more paths
    ]
}
```

## Creating a Custom Parser

### Step 1: Create Your Parser File

Create a new file in the `parsers/` directory, e.g., `MyCustomParser.js`:

```javascript
/**
 * MyCustomParser - Description of what format this parser handles
 */
class MyCustomParser extends BaseParser {
    constructor() {
        super(
            'My Custom Format',           // Display name
            'mycustom',                   // Unique ID (lowercase, no spaces)
            ['.mcf', '.custom'],          // File extensions
            'Description of the format'   // Optional description
        );
    }

    /**
     * Parse the file content and return standardized graph format
     */
    async parse(fileContent, fileName) {
        try {
            // 1. Parse your file format
            const myData = this.parseMyFormat(fileContent);

            // 2. Convert to standardized format
            const graphData = {
                metadata: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    importedFrom: fileName,
                    sourceFormat: 'My Custom Format'
                },
                nodes: myData.vertices.map(v => ({
                    id: v.identifier,
                    name: v.label,
                    x: v.posX,
                    y: v.posY,
                    type: v.category || 'normal',
                    maxRobots: v.capacity || 1,
                    parkingSpot: v.isParking || false,
                    noWaiting: v.noWait || false
                })),
                paths: myData.edges.map(e => ({
                    id: e.identifier,
                    name: e.label || '',
                    from: e.source,
                    to: e.destination,
                    bidirectional: e.twoWay || false,
                    speedLimit: e.maxSpeed || null,
                    width: e.pathWidth || null
                }))
            };

            // 3. Validate the result
            const validation = this.validate(graphData);
            if (!validation.valid) {
                throw new Error(`Invalid graph data:\n${validation.errors.join('\n')}`);
            }

            return graphData;

        } catch (error) {
            throw new Error(`Parsing error: ${error.message}`);
        }
    }

    parseMyFormat(content) {
        // Your custom parsing logic here
        // Return an intermediate representation
    }
}
```

### Step 2: Register Your Parser

Add your parser to `parsers/index.js`:

```javascript
function getAllParsers() {
    const parsers = [];

    // Built-in parsers
    if (typeof JSONParser !== 'undefined') {
        parsers.push(new JSONParser());
    }
    if (typeof CSVParser !== 'undefined') {
        parsers.push(new CSVParser());
    }

    // Add your custom parser here
    if (typeof MyCustomParser !== 'undefined') {
        parsers.push(new MyCustomParser());
    }

    return parsers;
}
```

### Step 3: Include Your Parser in HTML

Add a script tag in `index.html` (before `parsers/index.js`):

```html
<!-- Parser System -->
<script src="parsers/BaseParser.js"></script>
<script src="parsers/JSONParser.js"></script>
<script src="parsers/CSVParser.js"></script>
<script src="parsers/MyCustomParser.js"></script>  <!-- Add this line -->
<script src="parsers/index.js"></script>
```

### Step 4: Test Your Parser

1. Open Fleet Graph Wizard in your browser
2. Select your parser from the dropdown
3. Click "Import" and select a file in your format
4. Verify the nodes and paths are loaded correctly

## Built-in Parsers

### JSONParser

Handles the native Fleet Graph Wizard JSON format.

**File Extensions:** `.json`

**Example:**
```json
{
    "metadata": { "version": "1.0" },
    "nodes": [
        { "id": "n1", "name": "Node 1", "x": 0, "y": 0, "type": "normal" }
    ],
    "paths": [
        { "id": "p1", "from": "n1", "to": "n2", "bidirectional": true }
    ]
}
```

### CSVParser

Handles comma-separated values format with sections.

**File Extensions:** `.csv`, `.txt`

**Example:**
```csv
NODES
id,name,x,y,type,maxRobots,parkingSpot,noWaiting
node1,Entrance,5.0,3.2,normal,2,false,false
node2,Charging Bay,10.5,8.1,charging,1,true,false

PATHS
id,name,from,to,bidirectional,speedLimit,width
path1,Main Corridor,node1,node2,true,1.5,0.8
path2,,node2,node3,false,2.0,1.0
```

## BaseParser Methods

Your parser inherits these methods from `BaseParser`:

### `constructor(name, id, fileExtensions, description)`

Initialize your parser with its metadata.

### `async parse(fileContent, fileName)`

**Must be implemented by your parser.**

Parse the file content and return the standardized graph format.

### `validate(graphData)`

Validate the parsed graph data. Automatically checks:
- Required fields (id, x, y for nodes; id, from, to for paths)
- Valid node types
- Path references to existing nodes

Returns: `{ valid: boolean, errors: string[] }`

### `getAcceptString()`

Returns a file input accept string (e.g., `".csv,.txt"`).

### `getFormatDescription()`

Returns a human-readable format description.

## Advanced Examples

### XML Parser

```javascript
class XMLParser extends BaseParser {
    constructor() {
        super('XML Graph Format', 'xml', ['.xml', '.graphml']);
    }

    async parse(fileContent, fileName) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(fileContent, 'text/xml');

        const nodes = [];
        xmlDoc.querySelectorAll('node').forEach(nodeEl => {
            nodes.push({
                id: nodeEl.getAttribute('id'),
                name: nodeEl.getAttribute('label'),
                x: parseFloat(nodeEl.getAttribute('x')),
                y: parseFloat(nodeEl.getAttribute('y')),
                type: nodeEl.getAttribute('type') || 'normal',
                maxRobots: parseInt(nodeEl.getAttribute('capacity')) || 1,
                parkingSpot: nodeEl.getAttribute('parking') === 'true',
                noWaiting: nodeEl.getAttribute('noWait') === 'true'
            });
        });

        const paths = [];
        xmlDoc.querySelectorAll('edge').forEach(edgeEl => {
            paths.push({
                id: edgeEl.getAttribute('id'),
                name: edgeEl.getAttribute('label') || '',
                from: edgeEl.getAttribute('source'),
                to: edgeEl.getAttribute('target'),
                bidirectional: edgeEl.getAttribute('directed') !== 'true',
                speedLimit: parseFloat(edgeEl.getAttribute('speed')) || null,
                width: parseFloat(edgeEl.getAttribute('width')) || null
            });
        });

        return {
            metadata: {
                version: '1.0',
                created: new Date().toISOString(),
                importedFrom: fileName,
                sourceFormat: 'XML'
            },
            nodes,
            paths
        };
    }
}
```

### Binary Format Parser

```javascript
class BinaryParser extends BaseParser {
    constructor() {
        super('Binary Graph Format', 'binary', ['.bin', '.graph']);
    }

    async parse(fileContent, fileName) {
        // fileContent will be an ArrayBuffer
        const view = new DataView(fileContent);

        // Read header
        const version = view.getUint16(0);
        const nodeCount = view.getUint32(2);
        const pathCount = view.getUint32(6);

        let offset = 10;
        const nodes = [];

        // Read nodes
        for (let i = 0; i < nodeCount; i++) {
            // Your binary format parsing logic
            nodes.push({
                id: `node_${i}`,
                name: this.readString(view, offset),
                x: view.getFloat32(offset + 32),
                y: view.getFloat32(offset + 36),
                type: this.readNodeType(view.getUint8(offset + 40)),
                maxRobots: view.getUint8(offset + 41),
                parkingSpot: view.getUint8(offset + 42) === 1,
                noWaiting: view.getUint8(offset + 43) === 1
            });
            offset += 64; // Node record size
        }

        // Similar logic for paths...

        return { metadata: {}, nodes, paths };
    }
}
```

## Validation

The `validate()` method automatically checks:

✓ Graph data is an object
✓ Nodes array exists
✓ Each node has id, x, y
✓ Node types are valid
✓ Paths array exists
✓ Each path has id, from, to
✓ Path references point to existing nodes

You can add custom validation:

```javascript
validate(graphData) {
    // Call parent validation first
    const result = super.validate(graphData);

    // Add your custom checks
    graphData.nodes.forEach(node => {
        if (node.x < 0 || node.y < 0) {
            result.errors.push(`Node ${node.id} has negative coordinates`);
            result.valid = false;
        }
    });

    return result;
}
```

## Debugging Tips

1. **Use console.log** extensively during development
2. **Test with small files** first
3. **Check validation errors** - they're descriptive
4. **Use browser DevTools** to inspect parsed data
5. **Handle edge cases**: empty files, malformed data, missing fields

## Common Patterns

### Handling Missing Optional Fields

```javascript
maxRobots: node.capacity !== undefined ? node.capacity : 1,
parkingSpot: node.parking === true,  // Falsy values become false
speedLimit: node.speed || null       // Use null if not provided
```

### Coordinate Transformation

If your format uses different units:

```javascript
x: node.posX * 0.01,  // Convert cm to meters
y: node.posY * 0.01
```

### ID Generation

If your format doesn't have IDs:

```javascript
id: node.id || `node_${index}`,
id: path.id || `${path.from}_to_${path.to}`
```

## Best Practices

1. **Always validate** your output using `this.validate()`
2. **Provide clear error messages** when parsing fails
3. **Document your format** in the class JSDoc comment
4. **Handle edge cases** gracefully
5. **Use meaningful default values** for optional fields
6. **Test with various file examples**
7. **Consider adding a sample file** to the repository

## File Format Specifications

When creating a new parser, consider documenting:

- **File structure** - How data is organized
- **Required fields** - What must be present
- **Optional fields** - What can be omitted
- **Data types** - Expected types for each field
- **Encoding** - Character encoding or binary format
- **Limitations** - Known restrictions
- **Example files** - Sample data

## Troubleshooting

### Parser Not Appearing

- Check script tag order in index.html
- Ensure parser is registered in parsers/index.js
- Check browser console for errors

### Import Fails

- Verify file format matches parser expectations
- Check validation errors in console
- Ensure all required fields are present
- Confirm node IDs referenced in paths exist

### Invalid Data

- Use browser debugger to step through parse()
- Log intermediate parsing steps
- Verify coordinate values are numbers
- Check for null/undefined values

## Support

For questions or issues:
1. Check existing parsers (JSONParser, CSVParser) for examples
2. Review BaseParser.js for inherited methods
3. Test with minimal example files
4. Check browser console for detailed errors

## Contributing

If you create a useful parser for a common format, consider:
1. Adding it to the built-in parsers
2. Including example files
3. Adding tests
4. Updating this documentation

---

**Happy Parsing!** 🚀
