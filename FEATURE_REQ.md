# Fleet Graph Wizard - Feature Improvements List

## Development Status Summary

### Recently Implemented Features ✅

**Import/Export System:**
- ✅ **Plugin-based parser system** for custom import formats
- ✅ Parser dropdown selector in UI
- ✅ BaseParser abstract class with validation
- ✅ JSONParser (native format)
- ✅ CSVParser (example with NODES/PATHS sections)
- ✅ Standardized graph format output from all parsers
- ✅ Dynamic file type filtering based on selected parser
- ✅ Comprehensive parser development documentation

**UI/UX Improvements:**
- ✅ ESC key to close modals, cancel operations, and clear selections (including paths)
- ✅ Grid system aligned with map frame/world coordinates
- ✅ Snap to grid functionality (keyboard shortcut: S)
- ✅ Zoom level indicator in status bar
- ✅ Tool tooltips with keyboard shortcuts
- ✅ Keyboard shortcuts help modal (F1 or ?)
- ✅ Path distance display during creation and hover

**Selection & Editing:**
- ✅ Single click to select nodes/paths (double-click to edit in properties panel)
- ✅ Multi-selection with Shift+click
- ✅ Node alignment tools (horizontal, vertical, grid)
- ✅ Bulk edit properties for multiple nodes
- ✅ Improved path click detection (20px tolerance)
- ✅ Undo/Redo for all operations

**Validation & Tools:**
- ✅ Graph validation (disconnected nodes, overlaps, duplicates)
- ✅ Measurement tool (pixels and meters)
- ✅ Node/Path search with real-time filtering
- ✅ Recent files list (localStorage)

**Visual Enhancements:**
- ✅ Animated direction arrows on paths
- ✅ Speed-based arrow animation (faster arrows for higher speed limits)
- ✅ Custom node type icons (charging ⚡, pickup ↑, dropoff ↓, parking P, no-waiting ⊘)
- ✅ Icons positioned around nodes with intelligent overlap prevention
- ✅ Icons drawn above names for better visibility

**Removed Features:**
- ❌ ROS2 export (removed - use standard JSON with world coordinates instead)

### Legend
- ✅ = Fully implemented
- ⚠️ = Partially implemented
- ❌ = Removed or not planned

---

## High Priority & Easy to Implement (Quick Wins)

### ✅ 1. ESC to Close Modals & Cancel Operations
- ✅ Press ESC to close property modals
- ✅ Press ESC to cancel path drawing
- ✅ Press ESC to clear current selection (including paths)

### ✅ 2. Node Snapping to Grid
- ✅ Nodes snap to grid intersections when placing/moving
- ✅ Only active when grid is enabled
- ✅ Optional snap-to-grid toggle (keyboard shortcut: S)
- ✅ Grid aligned with map frame/world coordinates

### 3. Save State Before Map Load
- Warn user about unsaved changes before loading a new map
- Prompt to save current work
- Prevent accidental data loss

### 4. Better Error Messages
- More user-friendly error messages
- Clear instructions on how to fix issues
- Toast notifications for important events

### ✅ 5. Zoom Level Indicator
- ✅ Show current zoom percentage in status bar
- ✅ Display in real-time as user zooms
- ✅ Format: "Zoom: 100%"

### ✅ 6. Path Distance Display
- ✅ Show path length in meters when creating paths
- ✅ Display distance on hover over existing paths
- ✅ Use map resolution from YAML for accurate calculations

### ✅ 7. Tool Tooltips
- ✅ Add tooltips to toolbar buttons
- ✅ Explain what each tool does
- ✅ Show keyboard shortcuts in tooltips

### ✅ 8. Keyboard Shortcuts Help
- ✅ Add a help panel showing all keyboard shortcuts
- ✅ Open with '?' or F1 key
- ✅ Modal overlay with complete shortcut list

### 9. Auto-Save to LocalStorage
- Periodically save work automatically
- Configurable save interval
- Recovery option on page reload

### 10. Context Menu Position Fix
- Prevent context menu from appearing off-screen
- Automatically adjust position if near edge
- Ensure menu is always fully visible

---

## High Value Features (Medium Effort)

### ✅ 11. Node Alignment Tools
- ✅ Align multiple selected nodes horizontally
- ✅ Align multiple selected nodes vertically
- ✅ Align to grid intersections
- ⚠️ Distribute nodes evenly (not implemented)

### ✅ 12. Bulk Edit Properties
- ✅ Edit properties for multiple nodes at once
- ✅ Change type, max robots, parking status for selection
- ✅ Apply changes to all selected nodes

### ❌ 13. Export to ROS2 Format (REMOVED)
- ❌ ROS2 export feature was removed
- ✅ Standard JSON export available with world coordinates

### ✅ 14. Graph Validation
- ✅ Check for disconnected nodes
- ✅ Detect overlapping nodes
- ✅ Find duplicate paths between same nodes
- ✅ Validate duplicate node/path names

### ✅ 15. Measurement Tool
- ✅ Measure distance between any two points
- ✅ Click two points to show distance
- ✅ Display in both pixels and meters

### ✅ 16. Path Editing
- ✅ Edit existing paths (double-click to edit)
- ⚠️ Add intermediate waypoints (not implemented)
- ⚠️ Change path route (not implemented)
- ⚠️ Drag path segments to reshape (not implemented)

### ✅ 17. Recent Files List
- ✅ Quick access to recently loaded maps
- ✅ Stored in localStorage
- ✅ Show last 5-10 files
- ✅ Display in file menu dropdown

### ✅ 18. Undo/Redo for Property Edits
- ✅ Ensure all operations are undoable
- ✅ Include property changes in history
- ✅ Include node/path deletion in history

### ✅ 19. Multi-Path Selection
- ✅ Select multiple paths at once
- ✅ Shift+click to add paths to selection
- ✅ Delete multiple paths at once
- ✅ Improved path click detection (20px tolerance)

### ✅ 20. Node/Path Search
- ✅ Search bar to find nodes by name
- ✅ Search paths by name
- ✅ Highlight search results
- ✅ Auto-focus on found items

---

## Advanced Features (More Effort)

### 21. Layer System
- Multi-floor support with layers
- Switch between different floors
- Layer visibility toggles
- Import multiple maps for different floors

### 22. Auto-Router
- Automatically route paths around obstacles
- A* pathfinding algorithm
- Avoid black/occupied areas in map
- Generate optimal paths

### 23. Traffic Rules & Restrictions
- One-way paths
- Speed zones
- Restricted areas for certain robots
- Priority lanes

### 24. Path Cost Calculation
- Calculate travel time between nodes
- Consider path speed limits
- Show shortest path between two nodes
- Display total cost in time/distance

### 25. Graph Connectivity Checker
- Verify all nodes are reachable
- Find isolated node groups
- Suggest connections to fix issues
- Visual feedback for disconnected areas

### 26. Import from CSV
- Import node coordinates from CSV file
- Support for various CSV formats
- Batch node creation
- Map CSV columns to node properties

### 27. Multi-Robot Simulation
- Visualize multiple robot movements
- Animate robots along paths
- Show potential conflicts
- Test graph feasibility

### 28. 3D Visualization
- Optional 3D view for multi-floor buildings
- Rotate and tilt view
- Show elevation differences
- Export to 3D formats

---

## UI/UX Improvements

### 29. Measurement Tool
- Click to measure distances
- Show in both canvas and world coordinates
- Temporary measurement lines

### 30. Node Connection Indicators
- Show connection count on nodes
- Visual indicator for unconnected nodes
- Highlight connected nodes on hover

### 31. Path Preview with Distance
- Show estimated distance while drawing
- Display in real-time as mouse moves
- Update with actual distance after creation

### 32. Status Bar Improvements
- Add selected nodes count
- Show total nodes and paths
- Display current tool
- Show map resolution info

### 33. Dark/Light Theme Toggle
- Support for light theme
- Theme switcher in settings
- Remember user preference

### 34. Node Search/Filter
- Filter nodes by type
- Filter by properties (parking, charging)
- Show/hide filtered nodes

### 35. Zoom to Node
- Focus view on specific node
- Center and zoom to selected node
- Smooth animation

---

## Data Management

### 36. Auto-Save
- Periodic auto-save to localStorage
- Configurable interval (30s, 1min, 5min)
- Restore on crash/refresh

### 37. Save State Before Map Load
- Warn about unsaved changes
- Offer to save before loading
- Prevent data loss

### 38. Export to Multiple Formats
- JSON (current)
- ROS2 navigation format
- SVG for documentation
- CSV for node list

### 39. Version History
- Save multiple versions
- Compare versions
- Restore previous versions

### 40. Project Templates
- Pre-defined layouts
- Warehouse template
- Hospital template
- Office template

### 41. Backup/Restore
- Export entire project
- Import backed up projects
- Include map images

### 42. Import Multiple JSON Files
- Merge graphs from different files
- Handle node ID conflicts
- Combine multiple maps

---

## Performance Improvements

### 43. Render Optimization
- Only re-render when needed
- Stop continuous animation loop
- Render on demand

### 44. Virtual Rendering
- Only render visible elements
- Culling for off-screen nodes/paths
- Improve performance for large graphs

### 45. Lazy Loading for Large Maps
- Progressive image loading
- Load tiles for very large maps
- Reduce initial load time

### 46. Web Worker for PGM Parsing
- Move PGM parsing to web worker
- Prevent UI blocking
- Show progress indicator

### 47. Debounce Mouse Move
- Reduce coordinate update frequency
- Improve performance
- Smoother experience

---

## Validation & Quality

### 48. Node Overlap Detection
- Warn when nodes are too close
- Highlight overlapping nodes
- Suggest minimum distance

### 49. Path Collision Detection
- Detect when paths overlap
- Show crossing paths
- Validate path intersections

### 50. Graph Connectivity Check
- Verify all nodes are reachable
- Find isolated nodes
- Show connectivity graph

### 51. Duplicate Path Detection
- Warn about duplicate paths
- Show existing path when creating duplicate
- Prevent accidental duplicates

### 52. Minimum Path Width Validation
- Ensure paths are wide enough
- Based on robot dimensions
- Warning for narrow paths

### 53. Node Capacity Validation
- Check if max_robots makes sense
- Validate parking spot capacity
- Warn about capacity issues

---

## Visualization Enhancements

### 54. Heatmap Mode
- Show traffic density
- Node usage statistics
- Color-coded visualization

### ✅ 55. Path Flow Animation
- ✅ Animate arrows along paths
- ✅ Show direction of travel
- ✅ Visual flow indicators
- ✅ Speed-based animation (arrow speed matches path speed limit)
- ✅ Multiple arrows on longer paths

### ✅ 56. Custom Node Icons
- ✅ Different icons for different types
- ✅ Charging station (⚡ lightning bolt)
- ✅ Pickup point (↑ up arrow)
- ✅ Dropoff point (↓ down arrow)
- ✅ Parking spot (P letter)
- ✅ No waiting (⊘ diagonal line)
- ✅ Icons positioned around nodes
- ✅ Intelligent positioning to avoid overlap
- ⚠️ Upload custom icons (not implemented)

### 57. Path Style Customization
- Different line styles
- Dashed for restricted paths
- Dotted for optional paths

### 58. Node Clustering
- Group nearby nodes when zoomed out
- Show cluster size
- Expand on click

### 59. Highlight Connected Nodes
- Show connected nodes on selection
- Highlight paths to/from node
- Visual path tracing

### 60. 3D Visualization Mode
- Optional 3D view
- Multi-floor support
- Interactive camera

---

## Collaboration Features

### 61. Export Shareable Link
- Generate URL with encoded graph
- Share via link
- View-only mode

### 62. Comments/Notes on Canvas
- Add annotation markers
- Text notes on map
- Pin comments to locations

### 63. Change Log
- Track changes
- Show edit history
- Undo/redo with descriptions

### 64. Compare Versions
- Visual diff between versions
- Show added/removed nodes
- Highlight changes

---

## Robot-Specific Features

### 65. Traffic Rules
- Priority lanes
- One-way restrictions
- Speed limits by zone

### 66. Speed Zones
- Define zones with speed limits
- Visual zone boundaries
- Apply to multiple paths

### 67. Restricted Areas
- Mark no-go zones
- Robot-specific restrictions
- Time-based restrictions

### 68. Charging Station Optimizer
- Suggest optimal placement
- Based on coverage area
- Minimize travel to chargers

### 69. Path Cost Calculation
- Calculate travel time/cost
- Consider speed limits
- Factor in wait times

### 70. Multi-Robot Simulation
- Simulate multiple robots
- Detect conflicts
- Test graph feasibility

### 71. Deadlock Detection
- Identify potential deadlocks
- Suggest solutions
- Validate graph safety

---

## Developer Features

### 72. API Mode
- JavaScript API for control
- Programmatic node/path creation
- External integration

### 73. Plugin System
- Allow custom extensions
- Plugin architecture
- Custom tools and features

### 74. Debug Mode
- Show technical information
- Canvas coordinates
- Performance metrics

### 75. Console Export
- Export to browser console
- Various formats
- Quick testing

### 76. Validation Rules Engine
- Customizable validation rules
- Define custom checks
- Extensible validation

### 77. Custom Properties
- User-defined properties
- Custom fields for nodes/paths
- Flexible data model

---

## Accessibility

### 78. Keyboard Navigation
- Full keyboard control
- Tab navigation
- No mouse required

### 79. Screen Reader Support
- ARIA labels
- Accessible descriptions
- Navigation announcements

### 80. High Contrast Mode
- Better visibility
- For vision-impaired users
- Adjustable contrast levels

### 81. Configurable Font Sizes
- Adjustable text size
- Larger labels option
- Better readability

---

## Bug Fixes & Polish

### 82. Undo After Property Edit
- Property edits in undo history
- Consistent undo/redo
- All operations tracked

### 83. Save State on Node/Path Creation
- Ensure undo works for all operations
- Consistent state management
- No lost undo steps

### 84. Context Menu Position
- Keep menu on screen
- Adjust position near edges
- Prevent overflow

### 85. Modal Keyboard Navigation
- Tab through form fields
- Enter to submit
- ESC to cancel

### 86. Cancel Operations
- ESC to cancel actions
- Clear temporary states
- Reset tools

### 87. Better Error Messages
- User-friendly messages
- Clear instructions
- Helpful guidance

### 88. Loading Indicators
- Show progress for file loading
- Progress bars
- Status messages

---

## Implementation Priority

### Phase 1 - Quick Wins (1-2 days)
- ESC key functionality
- Node snapping to grid
- Zoom level indicator
- Tool tooltips
- Better error messages

### Phase 2 - High Value (1 week)
- Node alignment tools
- Bulk edit properties
- Graph validation
- Path distance display
- Recent files list

### Phase 3 - Advanced Features (2-3 weeks)
- Export to ROS2 format
- Layer system
- Auto-router
- Multi-robot simulation
- Path cost calculation

### Phase 4 - Performance & Polish (1 week)
- Render optimization
- Auto-save
- Version history
- Accessibility improvements
- Comprehensive testing
