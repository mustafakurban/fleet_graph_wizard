// Fleet Graph Wizard - Main Application
class FleetGraphWizard {
    constructor() {
        this.canvas = document.getElementById('mapCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Minimap
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.showMinimap = true;
        this.minimapSize = 200;

        // State
        this.mapImage = null;
        this.mapYaml = null;
        this.nodes = [];
        this.paths = [];
        this.selectedNode = null;
        this.selectedPath = null;
        this.currentTool = 'node';
        this.pathStart = null;
        this.tempPathEnd = null;

        // View transform
        this.offset = { x: 0, y: 0 };
        this.scale = 1;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };

        // Node dragging
        this.isDraggingNode = false;
        this.draggedNode = null;

        // Double-click detection
        this.lastClickTime = 0;
        this.lastClickNode = null;

        // Node counter
        this.nodeCounter = 1;

        // Display settings
        this.showPathLines = true;
        this.showPathNames = false;
        this.showNodePoints = true;
        this.showNodeNames = true;
        this.showNodeIcons = true;

        // Multi-select
        this.selectedNodes = [];
        this.isSelecting = false;
        this.selectionStart = null;
        this.selectionBox = null;

        // Hover state
        this.hoveredNode = null;
        this.hoveredPath = null;
        this.tooltipVisible = false;
        this.hoverTimeout = null;

        // Undo/Redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;

        // Animation
        this.animationTime = 0;
        this.selectedNodePulse = 0;

        // Grid
        this.showGrid = false;
        this.gridSize = 50; // pixels (will be calculated based on map resolution = 1 meter)
        this.snapToGrid = false; // Snap nodes to grid
        this.gridSizeMeters = 1.0; // Grid represents 1 meter in real world

        // Clipboard
        this.clipboard = null;

        // Measurement tool
        this.measureStart = null;
        this.measureEnd = null;

        // Multi-path selection
        this.selectedPaths = [];

        // Search
        this.searchResults = [];

        // Recent files
        this.recentFiles = this.loadRecentFiles();

        // Quick shortcuts visibility
        this.quickShortcutsVisible = false;

        // Parser system
        this.availableParsers = [];
        this.currentParser = null;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.initializeParsers();
        this.disableTools();
        this.setTool('node'); // Initialize tool indicator in status bar
        this.startAnimationLoop();
        this.render();
    }

    startAnimationLoop() {
        const animate = (timestamp) => {
            this.animationTime = timestamp;
            this.selectedNodePulse = (Math.sin(timestamp / 300) + 1) / 2; // 0 to 1
            this.render();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    saveState() {
        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Add new state
        const state = {
            nodes: JSON.parse(JSON.stringify(this.nodes)),
            paths: JSON.parse(JSON.stringify(this.paths)),
            nodeCounter: this.nodeCounter
        };

        this.history.push(state);

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            this.showToast('Undo');
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            this.showToast('Redo');
        }
    }

    restoreState(state) {
        this.nodes = JSON.parse(JSON.stringify(state.nodes));
        this.paths = JSON.parse(JSON.stringify(state.paths));
        this.nodeCounter = state.nodeCounter;
        this.selectedNodes = [];
        this.selectedNode = null;
        this.selectedPath = null;
        this.render();
    }

    showToast(message, duration = 2000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        window.addEventListener('resize', () => {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.render();
        });
    }

    disableTools() {
        // Disable all tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });

        // Disable export button
        document.getElementById('exportJsonBtn').disabled = true;
        document.getElementById('exportJsonBtn').style.opacity = '0.5';

        this.updateStatus('Please load a map first (YAML + PGM files)');
    }

    enableTools() {
        // Enable all tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });

        // Enable export button
        document.getElementById('exportJsonBtn').disabled = false;
        document.getElementById('exportJsonBtn').style.opacity = '1';
    }

    setupEventListeners() {
        // File loading
        document.getElementById('loadMapBtn').addEventListener('click', () => {
            document.getElementById('mapFilesInput').click();
        });

        document.getElementById('mapFilesInput').addEventListener('change', (e) => {
            this.loadMapFiles(e.target.files);
        });

        document.getElementById('importJsonBtn').addEventListener('click', () => {
            document.getElementById('graphInput').click();
        });

        document.getElementById('graphInput').addEventListener('change', (e) => {
            this.importGraph(e.target.files[0]);
        });

        document.getElementById('exportJsonBtn').addEventListener('click', () => {
            this.exportJson();
        });

        // Edit controls
        document.getElementById('alignHorizontalBtn').addEventListener('click', () => this.alignNodesHorizontal());
        document.getElementById('alignVerticalBtn').addEventListener('click', () => this.alignNodesVertical());
        document.getElementById('alignGridBtn').addEventListener('click', () => this.alignNodesToGrid());
        document.getElementById('bulkEditBtn').addEventListener('click', () => this.showBulkEditModal());
        document.getElementById('validateGraphBtn').addEventListener('click', () => this.validateGraph());

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Recent files
        document.getElementById('recentFilesBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showRecentFilesDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            const dropdown = document.getElementById('recentFilesDropdown');
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
            }
        });

        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.target.closest('.tool-btn').dataset.tool;
                this.setTool(tool);
                this.pathStart = null;
                this.tempPathEnd = null;
                this.render();
            });
        });

        // View controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('resetViewBtn').addEventListener('click', () => this.resetView());
        document.getElementById('fitAllBtn').addEventListener('click', () => this.fitAll());
        document.getElementById('focusSelectedBtn').addEventListener('click', () => this.focusSelected());

        // Display options
        document.getElementById('showPathLinesToggle').addEventListener('change', (e) => {
            this.showPathLines = e.target.checked;
            this.render();
        });

        document.getElementById('showPathNamesToggle').addEventListener('change', (e) => {
            this.showPathNames = e.target.checked;
            this.render();
        });

        document.getElementById('showNodePointsToggle').addEventListener('change', (e) => {
            this.showNodePoints = e.target.checked;
            this.render();
        });

        document.getElementById('showNodeNamesToggle').addEventListener('change', (e) => {
            this.showNodeNames = e.target.checked;
            this.render();
        });

        document.getElementById('showNodeIconsToggle').addEventListener('change', (e) => {
            this.showNodeIcons = e.target.checked;
            this.render();
        });

        document.getElementById('showGridToggle').addEventListener('change', (e) => {
            this.showGrid = e.target.checked;
            this.render();
        });

        document.getElementById('showMinimapToggle').addEventListener('change', (e) => {
            this.showMinimap = e.target.checked;
            this.minimapCanvas.style.display = e.target.checked ? 'block' : 'none';
            this.render();
        });

        // Grid size input
        document.getElementById('gridSizeInput').addEventListener('input', (e) => {
            const newSize = parseFloat(e.target.value);
            if (newSize > 0 && newSize <= 10) {
                this.gridSizeMeters = newSize;
                this.updateGridSize();
                this.render();
            }
        });

        // Minimap click to navigate
        this.minimapCanvas.addEventListener('click', (e) => this.handleMinimapClick(e));

        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Modal controls
        this.setupModalControls();
    }

    setupModalControls() {
        // Node modal
        const nodeModal = document.getElementById('nodeModal');
        const nodeForm = document.getElementById('nodePropertiesForm');
        const closeNodeModal = () => {
            nodeModal.style.display = 'none';
            this.selectedNode = null;
        };

        nodeModal.querySelector('.close').addEventListener('click', closeNodeModal);
        document.getElementById('cancelNodeBtn').addEventListener('click', closeNodeModal);

        nodeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.selectedNode) {
                this.updateNodeProperties();
                closeNodeModal();
                this.render();
            }
        });

        // Path modal
        const pathModal = document.getElementById('pathModal');
        const pathForm = document.getElementById('pathPropertiesForm');
        const closePathModal = () => {
            pathModal.style.display = 'none';
            this.selectedPath = null;
        };

        pathModal.querySelector('.close').addEventListener('click', closePathModal);
        document.getElementById('cancelPathBtn').addEventListener('click', closePathModal);

        pathForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.selectedPath) {
                this.updatePathProperties();
                closePathModal();
                this.render();
            }
        });

        // Bulk edit modal
        const bulkEditModal = document.getElementById('bulkEditModal');
        const bulkEditForm = document.getElementById('bulkEditForm');
        const closeBulkEditModal = () => {
            bulkEditModal.style.display = 'none';
        };

        bulkEditModal.querySelector('.close').addEventListener('click', closeBulkEditModal);
        document.getElementById('cancelBulkEditBtn').addEventListener('click', closeBulkEditModal);

        bulkEditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.applyBulkEdit();
            closeBulkEditModal();
            this.render();
        });

        // Validation modal
        const validationModal = document.getElementById('validationModal');
        const closeValidationModal = () => {
            validationModal.style.display = 'none';
        };

        validationModal.querySelector('.close').addEventListener('click', closeValidationModal);
        document.getElementById('closeValidationBtn').addEventListener('click', closeValidationModal);

        validationModal.addEventListener('click', (e) => {
            if (e.target === validationModal) {
                closeValidationModal();
            }
        });

        // Help modal
        const helpModal = document.getElementById('helpModal');
        const closeHelpModal = () => {
            helpModal.style.display = 'none';
        };

        helpModal.querySelector('.close').addEventListener('click', closeHelpModal);

        // Close help modal on click outside
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                closeHelpModal();
            }
        });
    }

    showHelpModal() {
        const helpModal = document.getElementById('helpModal');
        helpModal.style.display = 'block';
    }

    async loadMapFiles(files) {
        if (!files || files.length === 0) {
            console.error('No files provided');
            this.updateStatus('Please select map files (YAML + image)');
            return;
        }

        console.log('Loading map files:', Array.from(files).map(f => f.name));
        this.updateStatus('Processing map files...');

        try {
            // Separate YAML and image files
            let yamlFile = null;
            let imageFiles = [];

            for (const file of files) {
                const fileName = file.name.toLowerCase();
                if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
                    yamlFile = file;
                } else if (fileName.endsWith('.pgm')) {
                    imageFiles.push(file);
                } else {
                    console.warn('Ignoring unsupported file:', file.name);
                }
            }

            if (!yamlFile) {
                throw new Error('No YAML file found. Please select a .yaml or .yml file');
            }

            // Load and parse YAML
            const text = await yamlFile.text();
            console.log('YAML file content:', text);
            this.mapYaml = jsyaml.load(text);
            console.log('Parsed YAML:', this.mapYaml);
            this.updateMapInfo();

            // Find the image file that matches the YAML reference
            if (this.mapYaml.image) {
                const expectedImageName = this.mapYaml.image;
                console.log('Looking for image file:', expectedImageName);

                // Try to find matching image file in selected files
                let matchedImage = imageFiles.find(f => f.name === expectedImageName);

                if (matchedImage) {
                    console.log('Found matching image:', matchedImage.name);
                    await this.loadMapImage(matchedImage);
                    this.enableTools();
                    this.saveToRecentFiles(yamlFile.name, this.mapYaml);
                    this.updateStatus('Map and YAML loaded successfully!');
                } else if (imageFiles.length > 0) {
                    // Use the first image file found
                    console.log(`Image "${expectedImageName}" not found, using: ${imageFiles[0].name}`);
                    const proceed = confirm(
                        `YAML references image "${expectedImageName}" but you selected "${imageFiles[0].name}".\n\n` +
                        `Do you want to load "${imageFiles[0].name}" anyway?`
                    );
                    if (proceed) {
                        await this.loadMapImage(imageFiles[0]);
                        this.enableTools();
                        this.saveToRecentFiles(yamlFile.name, this.mapYaml);
                        this.updateStatus('Map and YAML loaded successfully!');
                    } else {
                        this.updateStatus(`YAML loaded. Please select the correct image: ${expectedImageName}`);
                    }
                } else {
                    // No image file selected - prompt user
                    this.updateStatus(`YAML loaded. Now select the image file: ${expectedImageName}`);
                    console.log('No image file selected, prompting user...');

                    // Note: Browser security prevents automatically reading files from the same directory
                    // User must manually select the image file
                    alert(`YAML file loaded successfully!\n\nThe YAML references: ${expectedImageName}\n\nPlease select this image file from the same directory.\n\nNote: Due to browser security, you must select both files (hold Ctrl/Cmd to select multiple files).`);
                }
            } else {
                // No image specified in YAML
                if (imageFiles.length > 0) {
                    await this.loadMapImage(imageFiles[0]);
                    this.enableTools();
                    this.saveToRecentFiles(yamlFile.name, this.mapYaml);
                    this.updateStatus('Map and YAML loaded successfully!');
                } else {
                    this.updateStatus('YAML loaded (no image specified)');
                }
            }
        } catch (error) {
            console.error('Error loading map files:', error);
            this.updateStatus('Error loading map files');
            alert('Error loading map files: ' + error.message);
        }
    }

    async loadMapImage(file) {
        if (!file) {
            console.error('No file provided to loadMapImage');
            return Promise.reject(new Error('No file provided'));
        }

        console.log('Loading image file:', file.name, 'Size:', file.size, 'bytes');

        // Check if it's a PGM file
        if (file.name.toLowerCase().endsWith('.pgm')) {
            return this.loadPGMImage(file);
        }

        // For PNG or other image formats
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('Image file read successfully, creating image element');
                const img = new Image();
                img.onload = () => {
                    console.log('Image loaded:', img.width, 'x', img.height);
                    this.mapImage = img;
                    this.updateGridSize(true);
                    this.resetView();
                    this.render();
                    resolve();
                };
                img.onerror = (err) => {
                    console.error('Error loading image element:', err);
                    const error = new Error(`Failed to load image: ${file.name}`);
                    reject(error);
                };
                img.src = e.target.result;
            };
            reader.onerror = (err) => {
                console.error('Error reading file:', err);
                const error = new Error(`Failed to read file: ${file.name}`);
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    }

    async loadPGMImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    console.log('Parsing PGM file...');
                    const arrayBuffer = e.target.result;
                    const pgmData = this.parsePGM(arrayBuffer);

                    // Convert PGM to canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = pgmData.width;
                    canvas.height = pgmData.height;
                    const ctx = canvas.getContext('2d');

                    const imageData = ctx.createImageData(pgmData.width, pgmData.height);
                    for (let i = 0; i < pgmData.data.length; i++) {
                        const value = pgmData.data[i];
                        imageData.data[i * 4] = value;     // R
                        imageData.data[i * 4 + 1] = value; // G
                        imageData.data[i * 4 + 2] = value; // B
                        imageData.data[i * 4 + 3] = 255;   // A
                    }
                    ctx.putImageData(imageData, 0, 0);

                    // Convert canvas to image
                    const img = new Image();
                    img.onload = () => {
                        console.log('PGM image loaded:', img.width, 'x', img.height);
                        this.mapImage = img;
                        this.updateGridSize(true);
                        this.resetView();
                        this.render();
                        resolve();
                    };
                    img.onerror = reject;
                    img.src = canvas.toDataURL();
                } catch (error) {
                    console.error('Error parsing PGM:', error);
                    reject(new Error(`Failed to parse PGM file: ${error.message}`));
                }
            };
            reader.onerror = (err) => {
                console.error('Error reading PGM file:', err);
                reject(new Error(`Failed to read PGM file: ${file.name}`));
            };
            reader.readAsArrayBuffer(file);
        });
    }

    parsePGM(arrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer);
        let offset = 0;

        // Read header as text
        let header = '';
        while (offset < bytes.length && header.indexOf('\n') === -1) {
            header += String.fromCharCode(bytes[offset++]);
        }

        // Check magic number (P5 for binary PGM)
        if (!header.startsWith('P5')) {
            throw new Error('Not a valid binary PGM file (expected P5)');
        }

        // Read the rest of the header
        let headerText = header;
        let headerComplete = false;
        let lines = [];

        while (!headerComplete && offset < bytes.length) {
            let line = '';
            while (offset < bytes.length && bytes[offset] !== 10) { // 10 = newline
                line += String.fromCharCode(bytes[offset++]);
            }
            offset++; // skip newline

            // Skip comments
            if (line.trim().startsWith('#')) {
                continue;
            }

            lines.push(line.trim());

            // We need: magic number (already read), width height, maxval
            if (lines.length >= 2) {
                headerComplete = true;
            }
        }

        // Parse dimensions
        const dimensions = lines[0].split(/\s+/);
        const width = parseInt(dimensions[0]);
        const height = parseInt(dimensions[1]);

        // Parse max value
        const maxval = parseInt(lines[1]);

        console.log('PGM info:', { width, height, maxval });

        // Read pixel data
        const pixelCount = width * height;
        const data = new Uint8Array(pixelCount);

        for (let i = 0; i < pixelCount && offset < bytes.length; i++) {
            // Normalize to 0-255 if maxval is different
            data[i] = Math.round((bytes[offset++] / maxval) * 255);
        }

        return { width, height, maxval, data };
    }

    updateMapInfo() {
        if (this.mapYaml) {
            const origin = this.mapYaml.origin || [0, 0, 0];
            const info = `Resolution: ${this.mapYaml.resolution}m/px | Origin: [${origin[0]}, ${origin[1]}, ${origin[2]}] | ` +
                        `Negate: ${this.mapYaml.negate || 0} | Free: ${this.mapYaml.free_thresh || 'N/A'} | ` +
                        `Occupied: ${this.mapYaml.occupied_thresh || 'N/A'}`;
            document.getElementById('mapInfoText').textContent = info;
        }
    }

    getCanvasPoint(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left - this.offset.x) / this.scale,
            y: (clientY - rect.top - this.offset.y) / this.scale
        };
    }

    getWorldCoordinates(canvasX, canvasY) {
        if (!this.mapYaml) return { x: canvasX, y: canvasY };

        const resolution = this.mapYaml.resolution;
        const origin = this.mapYaml.origin || [0, 0, 0];

        return {
            x: canvasX * resolution + origin[0],
            y: (this.mapImage.height - canvasY) * resolution + origin[1]
        };
    }

    handleMouseDown(e) {
        const point = this.getCanvasPoint(e.clientX, e.clientY);

        // Ignore right-click - it's handled by handleContextMenu
        if (e.button === 2) {
            return;
        }

        // Allow panning even if tools are disabled (if map is loaded)
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            if (this.mapImage) {
                this.isDragging = true;
                this.dragStart = { x: e.clientX - this.offset.x, y: e.clientY - this.offset.y };
                this.canvas.style.cursor = 'grabbing';
            }
            return;
        }

        // Check if tools are disabled
        if (!this.mapImage) {
            this.updateStatus('Please load a map first (YAML + PGM files)');
            return;
        }

        // Check if clicking on a node in select mode - enable dragging or multi-select
        if (this.currentTool === 'select') {
            const clickedNode = this.findNodeAt(point);

            if (clickedNode) {
                // Shift+click for multi-select
                if (e.shiftKey) {
                    const index = this.selectedNodes.findIndex(n => n.id === clickedNode.id);
                    if (index > -1) {
                        // Remove from selection
                        this.selectedNodes.splice(index, 1);
                    } else {
                        // Add to selection
                        this.selectedNodes.push(clickedNode);
                    }
                    this.updateSelectionCount();
                    this.render();
                    return;
                } else {
                    // Regular click - start dragging
                    this.isDraggingNode = true;
                    this.draggedNode = clickedNode;
                    this.canvas.style.cursor = 'move';

                    // If clicked node is not in selection, make it the only selected node
                    if (!this.selectedNodes.some(n => n.id === clickedNode.id)) {
                        this.selectedNodes = [clickedNode];
                    }
                    return;
                }
            } else {
                // Clicking on empty space - only start selection box if Shift is held
                if (e.shiftKey) {
                    this.isSelecting = true;
                    this.selectionStart = point;
                    this.selectionBox = null;
                    // Don't clear previous selection when shift is held
                } else {
                    // Clear selection when clicking empty space without Shift
                    this.selectedNodes = [];
                    this.render();
                }
            }
        }

        switch (this.currentTool) {
            case 'node':
                this.addNode(point);
                break;
            case 'path':
                this.handlePathDrawing(point);
                break;
            case 'select':
                this.handleSelection(point, e.shiftKey);
                break;
            case 'delete':
                this.handleDeletion(point);
                break;
            case 'measure':
                this.handleMeasurement(point);
                break;
        }
    }

    handleMouseMove(e) {
        const point = this.getCanvasPoint(e.clientX, e.clientY);
        const worldCoords = this.getWorldCoordinates(point.x, point.y);

        document.getElementById('coordsText').textContent =
            `Canvas: (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) | World: (${worldCoords.x.toFixed(3)}, ${worldCoords.y.toFixed(3)})`;

        // Handle view panning
        if (this.isDragging) {
            this.offset.x = e.clientX - this.dragStart.x;
            this.offset.y = e.clientY - this.dragStart.y;
            this.render();
            return;
        }

        // Handle node dragging
        if (this.isDraggingNode && this.draggedNode) {
            const snappedPoint = this.snapPointToGrid(point);
            this.draggedNode.x = snappedPoint.x;
            this.draggedNode.y = snappedPoint.y;
            this.render();
            return;
        }

        // Handle selection box dragging
        if (this.isSelecting && this.selectionStart) {
            this.selectionBox = {
                x: Math.min(this.selectionStart.x, point.x),
                y: Math.min(this.selectionStart.y, point.y),
                width: Math.abs(point.x - this.selectionStart.x),
                height: Math.abs(point.y - this.selectionStart.y)
            };
            this.render();
            return;
        }

        // Handle temporary path preview
        if (this.currentTool === 'path' && this.pathStart) {
            this.tempPathEnd = point;
            this.render();
            return;
        }

        // Handle temporary measurement preview
        if (this.currentTool === 'measure' && this.measureStart) {
            this.measureEnd = point;
            this.render();
            return;
        }

        // Update hover state for nodes and paths
        const previousHoveredNode = this.hoveredNode;
        const previousHoveredPath = this.hoveredPath;

        this.hoveredNode = this.findNodeAt(point);
        this.hoveredPath = this.hoveredNode ? null : this.findPathAt(point);

        // Show tooltip after a brief hover
        if (this.hoveredNode && this.hoveredNode !== previousHoveredNode) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = setTimeout(() => {
                this.tooltipVisible = true;
                this.render();
            }, 500);
        } else if (!this.hoveredNode) {
            clearTimeout(this.hoverTimeout);
            this.tooltipVisible = false;
        }

        // Update cursor and render if hover state changed
        if (this.hoveredNode !== previousHoveredNode || this.hoveredPath !== previousHoveredPath) {
            this.render();
        }

        // Show cursor feedback when hovering over nodes in select mode
        if (this.currentTool === 'select') {
            if (this.hoveredNode) {
                this.canvas.style.cursor = 'move';
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        }
    }

    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = 'crosshair';
        }

        if (this.isDraggingNode) {
            this.isDraggingNode = false;
            if (this.draggedNode) {
                this.updateStatus(`Node "${this.draggedNode.name}" moved to new position`);
            }
            this.draggedNode = null;
            this.canvas.style.cursor = 'crosshair';
        }

        // Complete selection box
        if (this.isSelecting && this.selectionBox) {
            // Find all nodes within the selection box
            const nodesInBox = this.nodes.filter(node => {
                return node.x >= this.selectionBox.x &&
                       node.x <= this.selectionBox.x + this.selectionBox.width &&
                       node.y >= this.selectionBox.y &&
                       node.y <= this.selectionBox.y + this.selectionBox.height;
            });

            // Add to existing selection (since selection box only activates with Shift)
            nodesInBox.forEach(node => {
                if (!this.selectedNodes.some(n => n.id === node.id)) {
                    this.selectedNodes.push(node);
                }
            });
            this.updateSelectionCount();

            if (this.selectedNodes.length > 0) {
                this.updateStatus(`Selected ${this.selectedNodes.length} node(s)`);
            }

            this.isSelecting = false;
            this.selectionBox = null;
            this.selectionStart = null;
            this.render();
        }
    }

    handleDoubleClick(e) {
        if (!this.mapImage) return;

        const point = this.getCanvasPoint(e.clientX, e.clientY);

        // Check for node double-click
        const clickedNode = this.findNodeAt(point);
        if (clickedNode) {
            this.showPropertiesPanel('node', clickedNode);
            return;
        }

        // Check for path double-click
        const clickedPath = this.findPathAt(point);
        if (clickedPath) {
            this.showPropertiesPanel('path', clickedPath);
            return;
        }
    }

    handleContextMenu(e) {
        e.preventDefault();
        if (!this.mapImage) return;

        const point = this.getCanvasPoint(e.clientX, e.clientY);
        const clickedNode = this.findNodeAt(point);

        this.showContextMenu(e.clientX, e.clientY, point, clickedNode);
    }

    showContextMenu(screenX, screenY, canvasPoint, node) {
        // Remove any existing context menu
        const existing = document.querySelector('.context-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = screenX + 'px';
        menu.style.top = screenY + 'px';

        if (node) {
            menu.innerHTML = `
                <div class="context-menu-item" onclick="app.duplicateNode('${node.id}')">Duplicate Node</div>
                <div class="context-menu-item" onclick="app.deleteNode('${node.id}')">Delete Node</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" onclick="app.copyNode('${node.id}')">Copy</div>
            `;
        } else {
            const gridLabel = this.mapYaml && this.mapYaml.resolution
                ? `Toggle Grid - ${this.gridSizeMeters}m (G)`
                : 'Toggle Grid (G)';
            const snapLabel = `Snap to Grid: ${this.snapToGrid ? 'ON' : 'OFF'} (S)`;

            menu.innerHTML = `
                <div class="context-menu-item" onclick="app.pasteNode(${canvasPoint.x}, ${canvasPoint.y})">Paste</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" onclick="app.toggleGrid()">${gridLabel}</div>
                <div class="context-menu-item" onclick="app.toggleSnapToGrid()">${snapLabel}</div>
            `;
        }

        document.body.appendChild(menu);

        // Close menu on click outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 10);
    }

    handleKeyDown(e) {
        // Check if user is typing in an input field or textarea
        const isInputField = e.target.tagName === 'INPUT' ||
                            e.target.tagName === 'TEXTAREA' ||
                            e.target.isContentEditable;

        // ESC key - Cancel operations and close modals
        if (e.key === 'Escape') {
            e.preventDefault();
            this.handleEscapeKey();
            return;
        }

        // Undo/Redo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            this.redo();
        }
        // Copy/Paste
        else if (e.ctrlKey && e.key === 'c') {
            // Allow copy in input fields
            if (isInputField) return;
            e.preventDefault();
            this.copySelected();
        } else if (e.ctrlKey && e.key === 'v') {
            // Allow paste in input fields
            if (isInputField) return;
            e.preventDefault();
            this.pasteNode();
        }
        // Delete
        else if (e.key === 'Delete' || e.key === 'Backspace') {
            // Allow delete/backspace in input fields for text editing
            if (isInputField) return;
            e.preventDefault();
            this.deleteSelected();
        }
        // Select All
        else if (e.ctrlKey && e.key === 'a') {
            // Allow select all in input fields
            if (isInputField) return;
            e.preventDefault();
            this.selectAll();
        }
        // Grid toggle
        else if (e.key === 'g' && !e.ctrlKey) {
            // Don't trigger shortcuts when typing in input fields
            if (isInputField) return;
            this.toggleGrid();
        }
        // Snap to grid toggle
        else if (e.key === 's' && !e.ctrlKey) {
            // Don't trigger shortcuts when typing in input fields
            if (isInputField) return;
            this.toggleSnapToGrid();
        }
        // Alignment shortcuts
        else if (e.key === 'h' && !e.ctrlKey) {
            // Don't trigger shortcuts when typing in input fields
            if (isInputField) return;
            e.preventDefault();
            this.alignNodesHorizontal();
        }
        else if (e.key === 'v' && !e.ctrlKey) {
            // Don't trigger shortcuts when typing in input fields
            if (isInputField) return;
            e.preventDefault();
            this.alignNodesVertical();
        }
        // Bulk edit
        else if (e.key === 'b' && !e.ctrlKey) {
            // Don't trigger shortcuts when typing in input fields
            if (isInputField) return;
            e.preventDefault();
            this.showBulkEditModal();
        }
        // Validate
        else if (e.key === 't' && !e.ctrlKey) {
            // Don't trigger shortcuts when typing in input fields
            if (isInputField) return;
            e.preventDefault();
            this.validateGraph();
        }
        // Tools
        else if (e.key === 'n' && !e.ctrlKey) {
            // Don't trigger shortcuts when typing in input fields
            if (isInputField) return;
            e.preventDefault();
            this.setTool('node');
        }
        else if (e.key === 'p' && !e.ctrlKey) {
            // Don't trigger shortcuts when typing in input fields
            if (isInputField) return;
            e.preventDefault();
            this.setTool('path');
        }
        else if (e.key === 'e' && !e.ctrlKey) {
            // Don't trigger shortcuts when typing in input fields
            if (isInputField) return;
            e.preventDefault();
            this.setTool('select');
        }
        else if (e.key === 'd' && !e.ctrlKey) {
            // Don't trigger shortcuts when typing in input fields
            if (isInputField) return;
            e.preventDefault();
            this.setTool('delete');
        }
        else if (e.key === 'm' && !e.ctrlKey) {
            // Don't trigger shortcuts when typing in input fields
            if (isInputField) return;
            e.preventDefault();
            this.setTool('measure');
        }
        // Search focus
        else if (e.key === 'f' && e.ctrlKey) {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        // Toggle quick shortcuts
        else if (e.key === 'k' && !e.ctrlKey) {
            e.preventDefault();
            this.toggleQuickShortcuts();
        }
        // Help
        else if (e.key === '?' || e.key === 'F1') {
            e.preventDefault();
            this.showHelpModal();
        }
    }

    toggleQuickShortcuts() {
        this.quickShortcutsVisible = !this.quickShortcutsVisible;
        const overlay = document.getElementById('quickShortcuts');
        overlay.style.display = this.quickShortcutsVisible ? 'block' : 'none';
        if (this.quickShortcutsVisible) {
            this.showToast('Press K to toggle shortcuts overlay');
        }
    }

    setTool(tool) {
        this.currentTool = tool;

        // Update button states
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`[data-tool="${tool}"]`);
        if (btn) {
            btn.classList.add('active');
        }

        // Update status bar with tool name and shortcut
        const toolInfo = {
            'node': { name: 'Node', key: 'N', icon: '⬤' },
            'path': { name: 'Path', key: 'P', icon: '⟶' },
            'select': { name: 'Select', key: 'E', icon: '⊕' },
            'delete': { name: 'Delete', key: 'D', icon: '✕' },
            'measure': { name: 'Measure', key: 'M', icon: '📏' }
        };

        const info = toolInfo[tool] || { name: tool, key: '', icon: '🛠️' };
        const toolText = document.getElementById('currentToolText');
        if (toolText) {
            toolText.textContent = `${info.icon} Tool: ${info.name}${info.key ? ' (' + info.key + ')' : ''}`;
        }
    }

    handleEscapeKey() {
        // Close any open modals
        const nodeModal = document.getElementById('nodeModal');
        const pathModal = document.getElementById('pathModal');
        const helpModal = document.getElementById('helpModal');

        if (helpModal.style.display === 'block') {
            helpModal.style.display = 'none';
            return;
        }

        if (nodeModal.style.display === 'block') {
            nodeModal.style.display = 'none';
            this.selectedNode = null;
            this.showToast('Cancelled');
            return;
        }
        if (pathModal.style.display === 'block') {
            pathModal.style.display = 'none';
            this.selectedPath = null;
            this.showToast('Cancelled');
            return;
        }

        // Close context menu
        const contextMenu = document.querySelector('.context-menu');
        if (contextMenu) {
            contextMenu.remove();
            return;
        }

        // Cancel path drawing
        if (this.currentTool === 'path' && this.pathStart) {
            this.pathStart = null;
            this.tempPathEnd = null;
            this.updateStatus('Path drawing cancelled');
            this.showToast('Path drawing cancelled');
            this.render();
            return;
        }

        // Cancel measurement
        if (this.currentTool === 'measure' && this.measureStart) {
            this.measureStart = null;
            this.measureEnd = null;
            this.updateStatus('Measurement cancelled');
            this.showToast('Measurement cancelled');
            this.render();
            return;
        }

        // Clear selection
        if (this.selectedNodes.length > 0 || this.selectedPaths.length > 0 || this.selectedPath) {
            this.selectedNodes = [];
            this.selectedPaths = [];
            this.selectedPath = null;
            this.updateStatus('Selection cleared');
            this.render();
            return;
        }

        // Cancel node dragging
        if (this.isDraggingNode) {
            this.isDraggingNode = false;
            this.draggedNode = null;
            this.canvas.style.cursor = 'crosshair';
            this.render();
            return;
        }
    }

    updateGridSize(showToast = false) {
        // Calculate grid size in pixels to represent the specified meters
        if (this.mapYaml && this.mapYaml.resolution) {
            // resolution is meters/pixel, so to get pixels per meter:
            this.gridSize = this.gridSizeMeters / this.mapYaml.resolution;
            console.log(`Grid updated: ${this.gridSizeMeters}m = ${this.gridSize.toFixed(1)} pixels (resolution: ${this.mapYaml.resolution}m/px)`);
            if (showToast) {
                this.showToast(`Grid: ${this.gridSizeMeters}m spacing`);
            }
        } else {
            // Default to 50 pixels if no resolution available
            this.gridSize = 50;
            console.log('Grid using default 50 pixels (no resolution data)');
        }

        // Update the input field
        const gridSizeInput = document.getElementById('gridSizeInput');
        if (gridSizeInput) {
            gridSizeInput.value = this.gridSizeMeters.toFixed(1);
        }
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.render();
        const gridInfo = this.mapYaml && this.mapYaml.resolution
            ? `Grid: ${this.gridSizeMeters}m spacing`
            : 'Grid On';
        this.showToast(this.showGrid ? gridInfo : 'Grid Off');
    }

    toggleSnapToGrid() {
        this.snapToGrid = !this.snapToGrid;
        const snapInfo = this.snapToGrid
            ? `Snap to Grid: ON (${this.gridSizeMeters}m)`
            : 'Snap to Grid: OFF';
        this.showToast(snapInfo);
    }

    snapPointToGrid(point) {
        if (!this.snapToGrid) return point;

        // Calculate grid offset based on map origin (world coordinates)
        let gridOffsetX = 0;
        let gridOffsetY = 0;

        if (this.mapYaml && this.mapYaml.origin) {
            const originX = this.mapYaml.origin[0]; // meters
            const originY = this.mapYaml.origin[1]; // meters

            // Canvas pixel where world (0,0) appears
            const worldZeroX = -originX / this.mapYaml.resolution;
            const worldZeroY = this.mapImage.height + (originY / this.mapYaml.resolution);

            // Offset to align with world coordinate grid
            gridOffsetX = worldZeroX % this.gridSize;
            gridOffsetY = worldZeroY % this.gridSize;
        }

        return {
            x: Math.round((point.x - gridOffsetX) / this.gridSize) * this.gridSize + gridOffsetX,
            y: Math.round((point.y - gridOffsetY) / this.gridSize) * this.gridSize + gridOffsetY
        };
    }

    copySelected() {
        if (this.selectedNodes.length > 0) {
            this.clipboard = {
                nodes: JSON.parse(JSON.stringify(this.selectedNodes)),
                type: 'nodes'
            };
            this.showToast(`Copied ${this.selectedNodes.length} node(s)`);
        } else if (this.selectedNode) {
            this.clipboard = {
                nodes: [JSON.parse(JSON.stringify(this.selectedNode))],
                type: 'nodes'
            };
            this.showToast('Copied node');
        }
    }

    copyNode(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            this.clipboard = {
                nodes: [JSON.parse(JSON.stringify(node))],
                type: 'nodes'
            };
            this.showToast('Copied node');
        }
    }

    pasteNode(x, y) {
        if (!this.clipboard || this.clipboard.type !== 'nodes') {
            this.showToast('Nothing to paste');
            return;
        }

        this.saveState();

        const centerX = x !== undefined ? x : this.canvas.width / (2 * this.scale) - this.offset.x / this.scale;
        const centerY = y !== undefined ? y : this.canvas.height / (2 * this.scale) - this.offset.y / this.scale;

        const newNodes = [];
        this.clipboard.nodes.forEach((node, index) => {
            const newNode = {
                ...node,
                id: `node_${this.nodeCounter++}`,
                name: `${node.name} (copy)`,
                x: centerX + (index * 50),
                y: centerY + (index * 50)
            };
            this.nodes.push(newNode);
            newNodes.push(newNode);
        });

        this.selectedNodes = newNodes;
        this.showToast(`Pasted ${newNodes.length} node(s)`);
        this.render();
    }

    duplicateNode(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;

        this.saveState();

        const newNode = {
            ...JSON.parse(JSON.stringify(node)),
            id: `node_${this.nodeCounter++}`,
            name: `${node.name} (copy)`,
            x: node.x + 50,
            y: node.y + 50
        };

        this.nodes.push(newNode);
        this.selectedNode = newNode;
        this.showToast('Node duplicated');
        this.render();
    }

    deleteNode(nodeId) {
        this.saveState();
        this.nodes = this.nodes.filter(n => n.id !== nodeId);
        this.paths = this.paths.filter(p => p.from !== nodeId && p.to !== nodeId);
        this.showToast('Node deleted');
        this.render();
    }

    deleteSelected() {
        if (this.selectedNodes.length > 0) {
            this.saveState();
            const ids = this.selectedNodes.map(n => n.id);
            this.nodes = this.nodes.filter(n => !ids.includes(n.id));
            this.paths = this.paths.filter(p => !ids.includes(p.from) && !ids.includes(p.to));
            this.showToast(`Deleted ${ids.length} node(s)`);
            this.selectedNodes = [];
            this.render();
        } else if (this.selectedNode) {
            this.deleteNode(this.selectedNode.id);
            this.selectedNode = null;
        }
    }

    selectAll() {
        this.selectedNodes = [...this.nodes];
        this.showToast(`Selected ${this.nodes.length} nodes`);
        this.render();
    }

    addNodeAtPosition(x, y) {
        this.saveState();
        const snappedPoint = this.snapPointToGrid({x, y});
        const node = {
            id: `node_${this.nodeCounter++}`,
            name: `Node ${this.nodeCounter - 1}`,
            x: snappedPoint.x,
            y: snappedPoint.y,
            type: 'normal',
            noWaiting: false,
            isParkingSpot: false,
            maxRobots: 1,
            notes: ''
        };

        this.nodes.push(node);
        this.selectedNode = node;
        this.showToast('Node added');
        this.render();
    }

    showPropertiesPanel(type, item) {
        const panel = document.getElementById('propertiesContent');

        if (type === 'node') {
            const worldCoords = this.getWorldCoordinates(item.x, item.y);
            panel.innerHTML = `
                <h4>Node Properties</h4>
                <div class="property-group">
                    <label>Name:</label>
                    <input type="text" id="propNodeName" value="${item.name}" />
                </div>
                <div class="property-group">
                    <label>Type:</label>
                    <select id="propNodeType">
                        <option value="normal" ${item.type === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="charging" ${item.type === 'charging' ? 'selected' : ''}>Charging Station</option>
                        <option value="pickup" ${item.type === 'pickup' ? 'selected' : ''}>Pickup Point</option>
                        <option value="dropoff" ${item.type === 'dropoff' ? 'selected' : ''}>Dropoff Point</option>
                    </select>
                </div>
                <div class="property-group">
                    <label>Position:</label>
                    <div class="coords-display">
                        Canvas: (${item.x.toFixed(1)}, ${item.y.toFixed(1)})<br>
                        World: (${worldCoords.x.toFixed(3)}, ${worldCoords.y.toFixed(3)})
                    </div>
                </div>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="propNoWaiting" ${item.noWaiting ? 'checked' : ''} />
                        No Waiting
                    </label>
                </div>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="propParkingSpot" ${item.isParkingSpot ? 'checked' : ''} />
                        Parking Spot
                    </label>
                </div>
                <div class="property-group">
                    <label>Max Robots:</label>
                    <input type="number" id="propMaxRobots" value="${item.maxRobots}" min="1" />
                </div>
                <div class="property-group">
                    <label>Notes:</label>
                    <textarea id="propNodeNotes" rows="3">${item.notes || ''}</textarea>
                </div>
                <button class="btn btn-primary" onclick="app.applyNodeProperties('${item.id}')">Apply</button>
                <button class="btn btn-secondary" onclick="app.clearPropertiesPanel()">Cancel</button>
            `;
        } else if (type === 'path') {
            const fromNode = this.nodes.find(n => n.id === item.from);
            const toNode = this.nodes.find(n => n.id === item.to);

            panel.innerHTML = `
                <h4>Path Properties</h4>
                <div class="property-group">
                    <label>Name:</label>
                    <input type="text" id="propPathName" value="${item.name}" />
                </div>
                <div class="property-group">
                    <label>From:</label>
                    <div class="info-text">${fromNode ? fromNode.name : 'Unknown'}</div>
                </div>
                <div class="property-group">
                    <label>To:</label>
                    <div class="info-text">${toNode ? toNode.name : 'Unknown'}</div>
                </div>
                <div class="property-group">
                    <label>Speed Limit (m/s):</label>
                    <input type="number" id="propSpeedLimit" value="${item.speedLimit}" min="0" step="0.1" />
                </div>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="propBidirectional" ${item.bidirectional ? 'checked' : ''} />
                        Bidirectional
                    </label>
                </div>
                <div class="property-group">
                    <label>Width (m):</label>
                    <input type="number" id="propPathWidth" value="${item.width}" min="0.1" step="0.1" />
                </div>
                <div class="property-group">
                    <label>Notes:</label>
                    <textarea id="propPathNotes" rows="3">${item.notes || ''}</textarea>
                </div>
                <button class="btn btn-primary" onclick="app.applyPathProperties('${item.id}')">Apply</button>
                <button class="btn btn-secondary" onclick="app.clearPropertiesPanel()">Cancel</button>
            `;
        }

        this.updateStatus(`Double-click to edit ${type} properties`);
    }

    applyNodeProperties(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;

        node.name = document.getElementById('propNodeName').value;
        node.type = document.getElementById('propNodeType').value;
        node.noWaiting = document.getElementById('propNoWaiting').checked;
        node.isParkingSpot = document.getElementById('propParkingSpot').checked;
        node.maxRobots = parseInt(document.getElementById('propMaxRobots').value);
        node.notes = document.getElementById('propNodeNotes').value;

        this.render();
        this.updateStatus(`Node "${node.name}" properties updated`);
        this.clearPropertiesPanel();
    }

    applyPathProperties(pathId) {
        const path = this.paths.find(p => p.id === pathId);
        if (!path) return;

        path.name = document.getElementById('propPathName').value;
        path.speedLimit = parseFloat(document.getElementById('propSpeedLimit').value);
        path.bidirectional = document.getElementById('propBidirectional').checked;
        path.width = parseFloat(document.getElementById('propPathWidth').value);
        path.notes = document.getElementById('propPathNotes').value;

        this.render();
        this.updateStatus(`Path "${path.name}" properties updated`);
        this.clearPropertiesPanel();
    }

    clearPropertiesPanel() {
        document.getElementById('propertiesContent').innerHTML =
            '<p class="help-text">Double-click on a node or path to edit its properties</p>';
    }

    handleWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const point = this.getCanvasPoint(e.clientX, e.clientY);

        // Zoom towards mouse position
        this.offset.x = e.clientX - (point.x * this.scale * zoomFactor);
        this.offset.y = e.clientY - (point.y * this.scale * zoomFactor);
        this.scale *= zoomFactor;

        this.updateZoomDisplay();
        this.render();
    }

    zoom(factor) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const point = this.getCanvasPoint(centerX, centerY);

        this.offset.x = centerX - (point.x * this.scale * factor);
        this.offset.y = centerY - (point.y * this.scale * factor);
        this.scale *= factor;

        this.updateZoomDisplay();
        this.render();
    }

    resetView() {
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.updateZoomDisplay();
        this.render();
    }

    updateZoomDisplay() {
        const zoomPercent = Math.round(this.scale * 100);
        document.getElementById('zoomText').textContent = `Zoom: ${zoomPercent}%`;
    }

    calculatePathDistance(fromNode, toNode) {
        // Calculate pixel distance
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);

        // Convert to meters if YAML data is available
        if (this.mapYaml && this.mapYaml.resolution) {
            const metersDistance = pixelDistance * this.mapYaml.resolution;
            return {
                pixels: pixelDistance,
                meters: metersDistance
            };
        }

        return {
            pixels: pixelDistance,
            meters: null
        };
    }

    fitAll() {
        if (this.nodes.length === 0 && !this.mapImage) {
            this.showToast('No nodes or map to fit');
            return;
        }

        let minX, maxX, minY, maxY;

        if (this.nodes.length > 0) {
            // Calculate bounding box of all nodes
            minX = Math.min(...this.nodes.map(n => n.x));
            maxX = Math.max(...this.nodes.map(n => n.x));
            minY = Math.min(...this.nodes.map(n => n.y));
            maxY = Math.max(...this.nodes.map(n => n.y));
        } else {
            // Use map dimensions
            minX = 0;
            maxX = this.mapImage.width;
            minY = 0;
            maxY = this.mapImage.height;
        }

        const width = maxX - minX;
        const height = maxY - minY;
        const padding = 50; // pixels

        // Calculate scale to fit
        const scaleX = (this.canvas.width - padding * 2) / width;
        const scaleY = (this.canvas.height - padding * 2) / height;
        this.scale = Math.min(scaleX, scaleY, 2); // Max scale of 2

        // Center the content
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        this.offset.x = this.canvas.width / 2 - centerX * this.scale;
        this.offset.y = this.canvas.height / 2 - centerY * this.scale;

        this.updateZoomDisplay();
        this.render();
        this.showToast('View fitted to content');
    }

    focusSelected() {
        const targets = this.selectedNodes.length > 0 ? this.selectedNodes :
                       (this.selectedNode ? [this.selectedNode] : []);

        if (targets.length === 0) {
            this.showToast('No node selected');
            return;
        }

        // Calculate center of selected nodes
        const avgX = targets.reduce((sum, n) => sum + n.x, 0) / targets.length;
        const avgY = targets.reduce((sum, n) => sum + n.y, 0) / targets.length;

        // Center view on selected nodes
        this.offset.x = this.canvas.width / 2 - avgX * this.scale;
        this.offset.y = this.canvas.height / 2 - avgY * this.scale;

        this.render();
        this.showToast(`Focused on ${targets.length} node(s)`);
    }

    addNode(point) {
        this.saveState();
        const snappedPoint = this.snapPointToGrid(point);
        const node = {
            id: `node_${this.nodeCounter++}`,
            name: `Node ${this.nodeCounter - 1}`,
            x: snappedPoint.x,
            y: snappedPoint.y,
            type: 'normal',
            noWaiting: false,
            isParkingSpot: false,
            maxRobots: 1,
            notes: ''
        };

        this.nodes.push(node);
        this.selectedNode = node;
        this.showNodeModal();
        this.updateStatus(`Added node: ${node.name}`);
        this.render();
    }

    handlePathDrawing(point) {
        const clickedNode = this.findNodeAt(point);

        if (!clickedNode) {
            this.updateStatus('Click on a node to start/end path');
            return;
        }

        if (!this.pathStart) {
            this.pathStart = clickedNode;
            this.updateStatus(`Path start: ${clickedNode.name} - Click another node to finish`);
        } else {
            if (this.pathStart.id !== clickedNode.id) {
                this.addPath(this.pathStart, clickedNode);
                this.pathStart = null;
                this.tempPathEnd = null;
            } else {
                this.updateStatus('Cannot create path to same node');
            }
        }
    }

    addPath(fromNode, toNode) {
        const path = {
            id: `path_${Date.now()}`,
            name: `${fromNode.name} -> ${toNode.name}`,
            from: fromNode.id,
            to: toNode.id,
            speedLimit: 1.0,
            bidirectional: false,
            width: 1.0,
            notes: ''
        };

        this.paths.push(path);
        this.selectedPath = path;
        this.showPathModal();
        this.updateStatus(`Added path: ${path.name}`);
        this.render();
    }

    handleSelection(point, shiftKey = false) {
        // Try to select node first
        const node = this.findNodeAt(point);
        if (node) {
            if (shiftKey) {
                // Multi-select nodes
                const index = this.selectedNodes.findIndex(n => n.id === node.id);
                if (index >= 0) {
                    this.selectedNodes.splice(index, 1);
                } else {
                    this.selectedNodes.push(node);
                }
                this.updateStatus(`Selected ${this.selectedNodes.length} node(s)`);
                this.render();
            } else {
                // Single select node - just select, don't open modal
                this.selectedNode = node;
                this.selectedNodes = [node];
                this.updateStatus(`Selected node: ${node.name}. Double-click to edit properties.`);
                this.render();
            }
            return;
        }

        // Try to select path
        const path = this.findPathAt(point);
        if (path) {
            if (shiftKey) {
                // Multi-select paths
                const index = this.selectedPaths.findIndex(p => p.id === path.id);
                if (index >= 0) {
                    this.selectedPaths.splice(index, 1);
                } else {
                    this.selectedPaths.push(path);
                }
                this.updateStatus(`Selected ${this.selectedPaths.length} path(s)`);
                this.render();
            } else {
                // Single select path - just select, don't open modal
                this.selectedPath = path;
                this.selectedPaths = [path];
                this.updateStatus(`Selected path: ${path.name}. Double-click to edit properties.`);
                this.render();
            }
        }
    }

    handleDeletion(point) {
        const node = this.findNodeAt(point);
        if (node) {
            this.nodes = this.nodes.filter(n => n.id !== node.id);
            this.paths = this.paths.filter(p => p.from !== node.id && p.to !== node.id);
            this.updateStatus(`Deleted node: ${node.name}`);
            this.render();
            return;
        }

        const path = this.findPathAt(point);
        if (path) {
            this.paths = this.paths.filter(p => p.id !== path.id);
            this.updateStatus(`Deleted path: ${path.name}`);
            this.render();
        }
    }

    handleMeasurement(point) {
        if (!this.measureStart) {
            this.measureStart = point;
            this.updateStatus('Click second point to measure distance');
        } else {
            // Calculate and show measurement
            const distance = this.calculatePathDistance(this.measureStart, point);
            let distanceText = `Distance: ${distance.pixels.toFixed(1)}px`;
            if (distance.meters !== null) {
                distanceText = `Distance: ${distance.meters.toFixed(3)}m (${distance.pixels.toFixed(1)}px)`;
            }
            this.showToast(distanceText, 5000);
            this.updateStatus(distanceText);

            // Reset measurement
            this.measureStart = null;
            this.measureEnd = null;
            this.render();
        }
    }

    findNodeAt(point, radius = 15) {
        return this.nodes.find(node => {
            const dx = node.x - point.x;
            const dy = node.y - point.y;
            return Math.sqrt(dx * dx + dy * dy) < radius;
        });
    }

    findPathAt(point, threshold = 20) {
        return this.paths.find(path => {
            const from = this.nodes.find(n => n.id === path.from);
            const to = this.nodes.find(n => n.id === path.to);
            if (!from || !to) return false;

            const dist = this.pointToLineDistance(point, from, to);
            return dist < threshold;
        });
    }

    pointToLineDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    showNodeModal() {
        if (!this.selectedNode) return;

        document.getElementById('nodeName').value = this.selectedNode.name;
        document.getElementById('nodeType').value = this.selectedNode.type;
        document.getElementById('noWaiting').checked = this.selectedNode.noWaiting;
        document.getElementById('isParkingSpot').checked = this.selectedNode.isParkingSpot;
        document.getElementById('maxRobots').value = this.selectedNode.maxRobots;
        document.getElementById('nodeNotes').value = this.selectedNode.notes;

        document.getElementById('nodeModal').style.display = 'block';
    }

    updateNodeProperties() {
        if (!this.selectedNode) return;

        this.saveState(); // Save state before modification

        this.selectedNode.name = document.getElementById('nodeName').value;
        this.selectedNode.type = document.getElementById('nodeType').value;
        this.selectedNode.noWaiting = document.getElementById('noWaiting').checked;
        this.selectedNode.isParkingSpot = document.getElementById('isParkingSpot').checked;
        this.selectedNode.maxRobots = parseInt(document.getElementById('maxRobots').value);
        this.selectedNode.notes = document.getElementById('nodeNotes').value;
    }

    showPathModal() {
        if (!this.selectedPath) return;

        document.getElementById('pathName').value = this.selectedPath.name;
        document.getElementById('pathSpeed').value = this.selectedPath.speedLimit;
        document.getElementById('isBidirectional').checked = this.selectedPath.bidirectional;
        document.getElementById('pathWidth').value = this.selectedPath.width;
        document.getElementById('pathNotes').value = this.selectedPath.notes;

        document.getElementById('pathModal').style.display = 'block';
    }

    updatePathProperties() {
        if (!this.selectedPath) return;

        this.saveState(); // Save state before modification

        this.selectedPath.name = document.getElementById('pathName').value;
        this.selectedPath.speedLimit = parseFloat(document.getElementById('pathSpeed').value);
        this.selectedPath.bidirectional = document.getElementById('isBidirectional').checked;
        this.selectedPath.width = parseFloat(document.getElementById('pathWidth').value);
        this.selectedPath.notes = document.getElementById('pathNotes').value;
    }

    async exportJson() {
        const data = {
            metadata: {
                version: '1.0',
                created: new Date().toISOString(),
                mapYaml: this.mapYaml
            },
            nodes: this.nodes.map(node => ({
                ...node,
                worldCoords: this.getWorldCoordinates(node.x, node.y)
            })),
            paths: this.paths
        };

        const json = JSON.stringify(data, null, 2);
        const filename = `fleet_graph_${Date.now()}.json`;

        // Check if File System Access API is supported
        if ('showSaveFilePicker' in window) {
            try {
                const options = {
                    suggestedName: filename,
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }]
                };

                const fileHandle = await window.showSaveFilePicker(options);
                const writable = await fileHandle.createWritable();
                await writable.write(json);
                await writable.close();

                this.updateStatus('Graph exported successfully to selected location');
            } catch (err) {
                // User cancelled or error occurred
                if (err.name !== 'AbortError') {
                    console.error('Error saving file:', err);
                    this.updateStatus('Error saving file: ' + err.message);
                    // Fallback to download
                    this.fallbackDownload(json, filename);
                }
            }
        } else {
            // Fallback for browsers that don't support File System Access API
            this.updateStatus('Your browser doesn\'t support direct file saving. Using download instead.');
            this.fallbackDownload(json, filename);
        }
    }

    fallbackDownload(json, filename) {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    initializeParsers() {
        // Load all available parsers
        if (typeof getAllParsers === 'function') {
            this.availableParsers = getAllParsers();
            this.currentParser = getDefaultParser();
            this.updateParserUI();
        } else {
            console.warn('Parser system not loaded. Make sure parser scripts are included.');
        }
    }

    updateParserUI() {
        const parserSelect = document.getElementById('parserSelect');
        if (!parserSelect) return;

        // Clear existing options
        parserSelect.innerHTML = '';

        // Add parser options
        this.availableParsers.forEach(parser => {
            const option = document.createElement('option');
            option.value = parser.id;
            option.textContent = parser.name;
            option.title = parser.description;
            parserSelect.appendChild(option);
        });

        // Set current parser
        if (this.currentParser) {
            parserSelect.value = this.currentParser.id;
        }

        // Update file input accept attribute
        this.updateFileInputAccept();
    }

    updateFileInputAccept() {
        const fileInput = document.getElementById('graphInput');
        if (!fileInput || !this.currentParser) return;

        fileInput.accept = this.currentParser.getAcceptString();
    }

    onParserChange(parserId) {
        const parser = getParserById(parserId);
        if (parser) {
            this.currentParser = parser;
            this.updateFileInputAccept();
            this.updateStatus(`Parser changed to: ${parser.name}`);
        }
    }

    async importGraph(file) {
        if (!file) return;

        if (!this.currentParser) {
            alert('No parser selected. Please select an import format.');
            return;
        }

        try {
            this.updateStatus(`Importing graph using ${this.currentParser.name}...`);

            // Read file content
            // For binary formats (SQLite), read as ArrayBuffer
            // For text formats (JSON, CSV), read as text
            let fileContent;
            if (this.currentParser.id === 'sqlite') {
                fileContent = await file.arrayBuffer();
            } else {
                fileContent = await file.text();
            }

            // Parse using selected parser
            const data = await this.currentParser.parse(fileContent, file.name);

            // Load the standardized graph data
            this.loadGraphData(data);

            this.updateStatus(`Imported ${this.nodes.length} nodes and ${this.paths.length} paths`);
            this.render();

        } catch (error) {
            console.error('Error importing graph:', error);
            alert('Error importing graph: ' + error.message);
            this.updateStatus('Import failed');
        }
    }

    loadGraphData(data) {
        // Load nodes
        this.nodes = data.nodes || [];

        // Convert world coordinates to canvas coordinates if needed
        this.nodes.forEach(node => {
            if (node.metadata?.coordinateType === 'world' && this.mapYaml && this.mapImage) {
                // Node has world coordinates, convert to canvas coordinates
                const canvasCoords = this.worldToCanvas(node.x, node.y);
                node.x = canvasCoords.x;
                node.y = canvasCoords.y;
                // Remove the marker since we've converted
                delete node.metadata.coordinateType;
            }
        });

        // Load paths
        this.paths = data.paths || [];

        // Load metadata
        if (data.metadata?.mapYaml) {
            this.mapYaml = data.metadata.mapYaml;
            this.updateMapInfo();
        }

        // Update node counter to avoid ID conflicts
        const maxNodeNumber = this.nodes.reduce((max, node) => {
            const match = node.id.match(/\d+$/);
            if (match) {
                return Math.max(max, parseInt(match[0]));
            }
            return max;
        }, 0);
        this.nodeCounter = maxNodeNumber + 1;

        // Enable tools if we have nodes/paths to work with
        if (this.nodes.length > 0 || this.paths.length > 0) {
            this.enableTools();
        }

        // Save state for undo
        this.saveState();
    }

    worldToCanvas(worldX, worldY) {
        if (!this.mapYaml || !this.mapImage) {
            return { x: worldX, y: worldY };
        }

        const resolution = this.mapYaml.resolution;
        const origin = this.mapYaml.origin || [0, 0, 0];

        // Reverse of getWorldCoordinates
        // worldX = canvasX * resolution + origin[0]
        // worldY = (mapHeight - canvasY) * resolution + origin[1]

        const canvasX = (worldX - origin[0]) / resolution;
        const canvasY = this.mapImage.height - (worldY - origin[1]) / resolution;

        return { x: canvasX, y: canvasY };
    }

    async importJson(file) {
        // Legacy method - redirect to new import system
        await this.importGraph(file);
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        ctx.translate(this.offset.x, this.offset.y);
        ctx.scale(this.scale, this.scale);

        // Draw map
        if (this.mapImage) {
            ctx.drawImage(this.mapImage, 0, 0);
        }

        // Draw grid on top of map if enabled
        if (this.showGrid) {
            this.drawGrid(ctx);
        }

        // Draw paths
        this.paths.forEach(path => this.drawPath(path));

        // Draw temp path
        if (this.pathStart && this.tempPathEnd) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(this.pathStart.x, this.pathStart.y);
            ctx.lineTo(this.tempPathEnd.x, this.tempPathEnd.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw distance label for temp path
            const distance = this.calculatePathDistance(this.pathStart, this.tempPathEnd);
            const midX = (this.pathStart.x + this.tempPathEnd.x) / 2;
            const midY = (this.pathStart.y + this.tempPathEnd.y) / 2;

            let distanceText = `${distance.pixels.toFixed(1)}px`;
            if (distance.meters !== null) {
                distanceText = `${distance.meters.toFixed(2)}m`;
            }

            ctx.font = 'bold 14px Arial';
            const textWidth = ctx.measureText(distanceText).width;
            const padding = 4;

            // Draw background
            ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
            ctx.fillRect(midX - textWidth / 2 - padding, midY - 10 - padding, textWidth + padding * 2, 20);

            // Draw text
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(distanceText, midX, midY);
        }

        // Draw nodes
        this.nodes.forEach(node => this.drawNode(node));

        // Draw measurement line
        if (this.measureStart && this.measureEnd) {
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(this.measureStart.x, this.measureStart.y);
            ctx.lineTo(this.measureEnd.x, this.measureEnd.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw measurement markers
            ctx.fillStyle = 'rgba(255, 0, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(this.measureStart.x, this.measureStart.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.measureEnd.x, this.measureEnd.y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Draw distance label
            const distance = this.calculatePathDistance(this.measureStart, this.measureEnd);
            const midX = (this.measureStart.x + this.measureEnd.x) / 2;
            const midY = (this.measureStart.y + this.measureEnd.y) / 2;

            let distanceText = `${distance.pixels.toFixed(1)}px`;
            if (distance.meters !== null) {
                distanceText = `${distance.meters.toFixed(3)}m`;
            }

            ctx.font = 'bold 14px Arial';
            const textWidth = ctx.measureText(distanceText).width;
            const padding = 4;

            // Draw background
            ctx.fillStyle = 'rgba(255, 0, 255, 0.9)';
            ctx.fillRect(midX - textWidth / 2 - padding, midY - 10 - padding, textWidth + padding * 2, 20);

            // Draw text
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(distanceText, midX, midY);
        }

        // Draw selection box
        if (this.isSelecting && this.selectionBox) {
            ctx.strokeStyle = 'rgba(0, 122, 204, 0.8)';
            ctx.fillStyle = 'rgba(0, 122, 204, 0.1)';
            ctx.lineWidth = 2 / this.scale;
            ctx.strokeRect(
                this.selectionBox.x,
                this.selectionBox.y,
                this.selectionBox.width,
                this.selectionBox.height
            );
            ctx.fillRect(
                this.selectionBox.x,
                this.selectionBox.y,
                this.selectionBox.width,
                this.selectionBox.height
            );
        }

        ctx.restore();

        // Draw tooltip
        if (this.hoveredNode && this.tooltipVisible) {
            this.drawTooltip(ctx);
        }

        // Draw path tooltip
        if (this.hoveredPath && this.tooltipVisible) {
            this.drawPathTooltip(ctx);
        }

        // Draw minimap
        if (this.showMinimap && this.mapImage) {
            this.renderMinimap();
        }
    }

    drawGrid(ctx) {
        // Calculate grid offset based on map origin (world coordinates)
        let gridOffsetX = 0;
        let gridOffsetY = 0;

        if (this.mapYaml && this.mapYaml.origin) {
            // Convert map origin from world coordinates to canvas pixels
            // origin[0] is x in world coords, origin[1] is y in world coords
            // We need to find where world coordinate (0,0) is on the canvas
            const originX = this.mapYaml.origin[0]; // meters
            const originY = this.mapYaml.origin[1]; // meters

            // Canvas pixel where world (0,0) appears
            const worldZeroX = -originX / this.mapYaml.resolution;
            const worldZeroY = this.mapImage.height + (originY / this.mapYaml.resolution);

            // Offset grid so it aligns with world coordinate grid
            gridOffsetX = worldZeroX % this.gridSize;
            gridOffsetY = worldZeroY % this.gridSize;
        }

        const startX = Math.floor(-this.offset.x / this.scale / this.gridSize) * this.gridSize + gridOffsetX;
        const startY = Math.floor(-this.offset.y / this.scale / this.gridSize) * this.gridSize + gridOffsetY;
        const endX = startX + (this.canvas.width / this.scale) + this.gridSize * 2;
        const endY = startY + (this.canvas.height / this.scale) + this.gridSize * 2;

        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.lineWidth = 1 / this.scale;

        // Vertical lines
        for (let x = startX; x <= endX; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y <= endY; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
    }

    drawTooltip(ctx) {
        if (!this.hoveredNode) return;

        const node = this.hoveredNode;
        const worldCoords = this.getWorldCoordinates(node.x, node.y);

        const lines = [
            `Name: ${node.name}`,
            `Type: ${node.type}`,
            `Position: (${worldCoords.x.toFixed(2)}, ${worldCoords.y.toFixed(2)})`,
            `Max Robots: ${node.maxRobots}`
        ];

        const padding = 8;
        const lineHeight = 16;
        const fontSize = 12;
        ctx.font = `${fontSize}px Arial`;

        const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
        const boxWidth = maxWidth + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2;

        // Position tooltip near mouse
        const tooltipX = (node.x * this.scale) + this.offset.x + 20;
        const tooltipY = (node.y * this.scale) + this.offset.y + 20;

        // Draw background
        ctx.fillStyle = 'rgba(45, 45, 45, 0.95)';
        ctx.fillRect(tooltipX, tooltipY, boxWidth, boxHeight);

        // Draw border
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 1;
        ctx.strokeRect(tooltipX, tooltipY, boxWidth, boxHeight);

        // Draw text
        ctx.fillStyle = '#e0e0e0';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        lines.forEach((line, i) => {
            ctx.fillText(line, tooltipX + padding, tooltipY + padding + i * lineHeight);
        });
    }

    drawPathTooltip(ctx) {
        if (!this.hoveredPath) return;

        const path = this.hoveredPath;
        const fromNode = this.nodes.find(n => n.id === path.from);
        const toNode = this.nodes.find(n => n.id === path.to);

        if (!fromNode || !toNode) return;

        const distance = this.calculatePathDistance(fromNode, toNode);
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;

        const lines = [
            `Path: ${path.name}`,
            `From: ${fromNode.name}`,
            `To: ${toNode.name}`,
            distance.meters !== null ? `Distance: ${distance.meters.toFixed(2)}m` : `Distance: ${distance.pixels.toFixed(1)}px`,
            `Speed: ${path.speedLimit}m/s`,
            `Width: ${path.width}m`,
            `Direction: ${path.bidirectional ? 'Bidirectional' : 'One-way'}`
        ];

        const padding = 8;
        const lineHeight = 16;
        const fontSize = 12;
        ctx.font = `${fontSize}px Arial`;

        const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
        const boxWidth = maxWidth + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2;

        // Position tooltip near path midpoint
        const tooltipX = (midX * this.scale) + this.offset.x + 20;
        const tooltipY = (midY * this.scale) + this.offset.y + 20;

        // Draw background
        ctx.fillStyle = 'rgba(45, 45, 45, 0.95)';
        ctx.fillRect(tooltipX, tooltipY, boxWidth, boxHeight);

        // Draw border
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.strokeRect(tooltipX, tooltipY, boxWidth, boxHeight);

        // Draw text
        ctx.fillStyle = '#e0e0e0';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        lines.forEach((line, i) => {
            ctx.fillText(line, tooltipX + padding, tooltipY + padding + i * lineHeight);
        });
    }

    renderMinimap() {
        const mmCtx = this.minimapCtx;
        const size = this.minimapSize;

        // Calculate aspect ratio
        const aspect = this.mapImage.width / this.mapImage.height;
        let mmWidth, mmHeight;
        if (aspect > 1) {
            mmWidth = size;
            mmHeight = size / aspect;
        } else {
            mmWidth = size * aspect;
            mmHeight = size;
        }

        // Set canvas size
        this.minimapCanvas.width = mmWidth;
        this.minimapCanvas.height = mmHeight;

        // Clear minimap
        mmCtx.clearRect(0, 0, mmWidth, mmHeight);

        // Draw map
        mmCtx.drawImage(this.mapImage, 0, 0, mmWidth, mmHeight);

        // Draw nodes
        mmCtx.fillStyle = '#007acc';
        this.nodes.forEach(node => {
            const x = (node.x / this.mapImage.width) * mmWidth;
            const y = (node.y / this.mapImage.height) * mmHeight;
            mmCtx.beginPath();
            mmCtx.arc(x, y, 2, 0, Math.PI * 2);
            mmCtx.fill();
        });

        // Draw paths
        mmCtx.strokeStyle = '#00ff00';
        mmCtx.lineWidth = 1;
        this.paths.forEach(path => {
            const fromNode = this.nodes.find(n => n.id === path.from);
            const toNode = this.nodes.find(n => n.id === path.to);
            if (fromNode && toNode) {
                const x1 = (fromNode.x / this.mapImage.width) * mmWidth;
                const y1 = (fromNode.y / this.mapImage.height) * mmHeight;
                const x2 = (toNode.x / this.mapImage.width) * mmWidth;
                const y2 = (toNode.y / this.mapImage.height) * mmHeight;
                mmCtx.beginPath();
                mmCtx.moveTo(x1, y1);
                mmCtx.lineTo(x2, y2);
                mmCtx.stroke();
            }
        });

        // Draw viewport rectangle
        const viewportX = (-this.offset.x / this.scale / this.mapImage.width) * mmWidth;
        const viewportY = (-this.offset.y / this.scale / this.mapImage.height) * mmHeight;
        const viewportW = (this.canvas.width / this.scale / this.mapImage.width) * mmWidth;
        const viewportH = (this.canvas.height / this.scale / this.mapImage.height) * mmHeight;

        mmCtx.strokeStyle = '#ffff00';
        mmCtx.lineWidth = 2;
        mmCtx.strokeRect(viewportX, viewportY, viewportW, viewportH);
    }

    handleMinimapClick(e) {
        const rect = this.minimapCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert minimap coords to map coords
        const aspect = this.mapImage.width / this.mapImage.height;
        let mmWidth, mmHeight;
        if (aspect > 1) {
            mmWidth = this.minimapSize;
            mmHeight = this.minimapSize / aspect;
        } else {
            mmWidth = this.minimapSize * aspect;
            mmHeight = this.minimapSize;
        }

        const mapX = (x / mmWidth) * this.mapImage.width;
        const mapY = (y / mmHeight) * this.mapImage.height;

        // Center viewport on clicked position
        this.offset.x = -mapX * this.scale + this.canvas.width / 2;
        this.offset.y = -mapY * this.scale + this.canvas.height / 2;

        this.render();
    }

    drawNode(node) {
        const ctx = this.ctx;
        const radius = 6;
        const isSelected = this.selectedNode?.id === node.id || this.selectedNodes.some(n => n.id === node.id);
        const isHovered = this.hoveredNode?.id === node.id;

        // Draw node circle (if enabled)
        if (this.showNodePoints) {
            // Use consistent color for all nodes
            const color = '#007acc';

            // Draw glow effect for selected nodes with pulse animation
            if (isSelected) {
                const pulseRadius = radius + 8 + (this.selectedNodePulse * 4);
                ctx.shadowColor = color;
                ctx.shadowBlur = 20;
                ctx.fillStyle = `${color}40`; // Semi-transparent
                ctx.beginPath();
                ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Draw hover highlight
            if (isHovered) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw main node circle
            ctx.fillStyle = color;
            ctx.strokeStyle = isSelected ? '#ffff00' : '#fff';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw multi-select indicator (small dot on top-right)
            if (this.selectedNodes.length > 1 && isSelected) {
                ctx.fillStyle = '#ff00ff';
                ctx.beginPath();
                ctx.arc(node.x + radius - 2, node.y - radius + 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw name with background for better visibility (if enabled)
        // Draw names BEFORE icons so icons appear on top
        if (this.showNodeNames) {
            ctx.font = 'bold 12px Arial';
            const textWidth = ctx.measureText(node.name).width;
            const textHeight = 12;
            const padding = 4;
            const offset = 8; // Additional offset from node edge

            // Draw background rectangle
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(
                node.x + radius + offset,
                node.y - textHeight / 2 - padding,
                textWidth + padding * 2,
                textHeight + padding * 2
            );

            // Draw text - centered vertically with node
            ctx.fillStyle = isSelected ? '#ffff00' : '#ffff00'; // Yellow for better visibility
            ctx.textBaseline = 'middle';
            ctx.fillText(node.name, node.x + radius + offset + padding, node.y);
            ctx.textBaseline = 'alphabetic'; // Reset to default
        }

        // Draw type icons around the node AFTER names so they appear on top
        if (this.showNodeIcons) {
            this.drawNodeIcons(node, radius);
        }
    }

    drawNodeIcons(node, nodeRadius) {
        const iconOffset = nodeRadius + 14; // Distance from node center
        const iconSize = 10;
        const diagonalOffset = iconOffset * 0.85; // Increased for better diagonal spacing

        // Draw type-specific icon
        switch (node.type) {
            case 'charging':
                // Lightning bolt icon for charging station - TOP
                this.drawChargingIcon(node.x, node.y - iconOffset, iconSize);
                break;
            case 'pickup':
                // Up arrow icon for pickup point - RIGHT
                this.drawPickupIcon(node.x + iconOffset, node.y, iconSize);
                break;
            case 'dropoff':
                // Down arrow icon for dropoff point - LEFT
                this.drawDropoffIcon(node.x - iconOffset, node.y, iconSize);
                break;
        }

        // Draw parking icon if it's a parking spot (can combine with other types)
        if (node.isParkingSpot) {
            // BOTTOM position
            this.drawParkingIcon(node.x, node.y + iconOffset, iconSize);
        }

        // Draw no-waiting icon - use diagonal position that doesn't overlap with type icons
        if (node.noWaiting) {
            // Choose diagonal position based on what type icon exists
            let noWaitX, noWaitY;

            if (node.type === 'charging') {
                // If charging (top), put no-waiting at bottom-right diagonal
                noWaitX = node.x + diagonalOffset;
                noWaitY = node.y + diagonalOffset;
            } else if (node.type === 'pickup') {
                // If pickup (right), put no-waiting at top-left diagonal
                noWaitX = node.x - diagonalOffset;
                noWaitY = node.y - diagonalOffset;
            } else if (node.type === 'dropoff') {
                // If dropoff (left), put no-waiting at top-right diagonal
                noWaitX = node.x + diagonalOffset;
                noWaitY = node.y - diagonalOffset;
            } else {
                // Default: top-right diagonal
                noWaitX = node.x + diagonalOffset;
                noWaitY = node.y - diagonalOffset;
            }

            this.drawNoWaitingIcon(noWaitX, noWaitY, iconSize);
        }
    }

    drawChargingIcon(x, y, size) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);

        // Draw circle background
        ctx.fillStyle = '#28a745';
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw lightning bolt
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-2, -5);
        ctx.lineTo(2, -1);
        ctx.lineTo(0, -1);
        ctx.lineTo(2, 5);
        ctx.lineTo(-2, 1);
        ctx.lineTo(0, 1);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    drawPickupIcon(x, y, size) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);

        // Draw circle background
        ctx.fillStyle = '#ffc107';
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw up arrow
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(4, 1);
        ctx.lineTo(1.5, 1);
        ctx.lineTo(1.5, 5);
        ctx.lineTo(-1.5, 5);
        ctx.lineTo(-1.5, 1);
        ctx.lineTo(-4, 1);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    drawDropoffIcon(x, y, size) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);

        // Draw circle background
        ctx.fillStyle = '#17a2b8';
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw down arrow
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(4, -1);
        ctx.lineTo(1.5, -1);
        ctx.lineTo(1.5, -5);
        ctx.lineTo(-1.5, -5);
        ctx.lineTo(-1.5, -1);
        ctx.lineTo(-4, -1);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    drawParkingIcon(x, y, size) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);

        // Draw circle background
        ctx.fillStyle = '#6c757d';
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw P letter
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', 0, 0);

        ctx.restore();
    }

    drawNoWaitingIcon(x, y, size) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);

        // Draw circle background
        ctx.fillStyle = '#dc3545';
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw diagonal line (no waiting symbol)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(5, 5);
        ctx.stroke();

        ctx.restore();
    }

    drawPath(path) {
        const fromNode = this.nodes.find(n => n.id === path.from);
        const toNode = this.nodes.find(n => n.id === path.to);

        if (!fromNode || !toNode) return;

        const ctx = this.ctx;
        const isHovered = this.hoveredPath?.id === path.id;
        const isSelected = this.selectedPath?.id === path.id || this.selectedPaths.some(p => p.id === path.id);

        // Draw path line (if enabled)
        if (this.showPathLines) {
            // Calculate line width based on path width property (convert meters to pixels)
            const baseWidth = 3;
            const widthMultiplier = path.width || 1.0;
            const lineWidth = baseWidth * widthMultiplier;

            // Draw glow for selected/hovered paths
            if (isSelected || isHovered) {
                ctx.strokeStyle = isSelected ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = lineWidth + 6;
                ctx.beginPath();
                ctx.moveTo(fromNode.x, fromNode.y);
                ctx.lineTo(toNode.x, toNode.y);
                ctx.stroke();
            }

            // Draw main path line
            ctx.strokeStyle = isSelected ? '#ffff00' : '#00ff00';
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.stroke();

            // Draw animated arrows with speed-based animation
            this.drawAnimatedArrows(fromNode, toNode, isSelected, path.speedLimit);

            // Draw reverse arrows if bidirectional
            if (path.bidirectional) {
                this.drawAnimatedArrows(toNode, fromNode, isSelected, path.speedLimit);
            }
        }

        // Draw path name at the midpoint (only if enabled)
        if (this.showPathNames && path.name) {
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;

            ctx.font = 'bold 12px Arial';
            const textWidth = ctx.measureText(path.name).width;
            const textHeight = 12;
            const padding = 3;

            // Draw background rectangle for better visibility
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
                midX - textWidth / 2 - padding,
                midY - textHeight - padding,
                textWidth + padding * 2,
                textHeight + padding * 2
            );

            // Draw text in yellow
            ctx.fillStyle = '#ffff00'; // Yellow for better visibility
            ctx.textAlign = 'center';
            ctx.fillText(path.name, midX, midY);
            ctx.textAlign = 'left'; // Reset to default
        }
    }

    drawArrow(from, to, isSelected = false) {
        const ctx = this.ctx;
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowLength = 15;
        const arrowWidth = 8;

        // Position arrow near the end
        const arrowX = to.x - Math.cos(angle) * 15;
        const arrowY = to.y - Math.sin(angle) * 15;

        ctx.fillStyle = isSelected ? '#ffff00' : '#00ff00';
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
            arrowY - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)
        );
        ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
            arrowY - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)
        );
        ctx.closePath();
        ctx.fill();
    }

    drawAnimatedArrows(from, to, isSelected = false, speedLimit = 1.0) {
        const ctx = this.ctx;
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const distance = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);

        const arrowLength = 12;
        const arrowWidth = 6;
        const spacing = 80; // Distance between arrows
        const numArrows = Math.max(2, Math.floor(distance / spacing));

        // Animation speed - dynamically based on path speed limit
        // Base speed for 1.0 m/s, scales linearly with speed limit
        const baseAnimationSpeed = 0.0005;
        const animationSpeed = baseAnimationSpeed * speedLimit;
        const animationOffset = (this.animationTime * animationSpeed) % 1;

        ctx.fillStyle = isSelected ? '#ffff00' : '#00ff00';

        for (let i = 0; i < numArrows; i++) {
            // Calculate position along the path (0 to 1)
            let t = (i / numArrows + animationOffset) % 1;

            // Skip arrow if too close to nodes
            if (t < 0.1 || t > 0.9) continue;

            // Calculate arrow position
            const arrowX = from.x + (to.x - from.x) * t;
            const arrowY = from.y + (to.y - from.y) * t;

            // Draw arrow
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
                arrowX - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
                arrowY - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)
            );
            ctx.lineTo(
                arrowX - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
                arrowY - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)
            );
            ctx.closePath();
            ctx.fill();
        }
    }

    // === ALIGNMENT TOOLS ===
    alignNodesHorizontal() {
        if (this.selectedNodes.length < 2) {
            this.showToast('Select at least 2 nodes to align');
            return;
        }

        this.saveState();
        const avgY = this.selectedNodes.reduce((sum, node) => sum + node.y, 0) / this.selectedNodes.length;

        this.selectedNodes.forEach(node => {
            node.y = avgY;
        });

        this.showToast(`Aligned ${this.selectedNodes.length} nodes horizontally`);
        this.render();
    }

    alignNodesVertical() {
        if (this.selectedNodes.length < 2) {
            this.showToast('Select at least 2 nodes to align');
            return;
        }

        this.saveState();
        const avgX = this.selectedNodes.reduce((sum, node) => sum + node.x, 0) / this.selectedNodes.length;

        this.selectedNodes.forEach(node => {
            node.x = avgX;
        });

        this.showToast(`Aligned ${this.selectedNodes.length} nodes vertically`);
        this.render();
    }

    alignNodesToGrid() {
        if (this.selectedNodes.length === 0) {
            this.showToast('Select nodes to align to grid');
            return;
        }

        this.saveState();

        // Calculate grid offset based on map origin (world coordinates)
        let gridOffsetX = 0;
        let gridOffsetY = 0;

        if (this.mapYaml && this.mapYaml.origin) {
            const originX = this.mapYaml.origin[0]; // meters
            const originY = this.mapYaml.origin[1]; // meters

            // Canvas pixel where world (0,0) appears
            const worldZeroX = -originX / this.mapYaml.resolution;
            const worldZeroY = this.mapImage.height + (originY / this.mapYaml.resolution);

            // Offset to align with world coordinate grid
            gridOffsetX = worldZeroX % this.gridSize;
            gridOffsetY = worldZeroY % this.gridSize;
        }

        this.selectedNodes.forEach(node => {
            // Always snap to grid when using this button, regardless of snapToGrid setting
            node.x = Math.round((node.x - gridOffsetX) / this.gridSize) * this.gridSize + gridOffsetX;
            node.y = Math.round((node.y - gridOffsetY) / this.gridSize) * this.gridSize + gridOffsetY;
        });

        this.showToast(`Aligned ${this.selectedNodes.length} nodes to grid`);
        this.render();
    }

    // === BULK EDIT ===
    showBulkEditModal() {
        if (this.selectedNodes.length === 0) {
            this.showToast('Select nodes to bulk edit');
            return;
        }

        const modal = document.getElementById('bulkEditModal');
        document.getElementById('bulkEditCount').textContent = this.selectedNodes.length;

        // Reset form
        document.getElementById('bulkNodeType').value = '';
        document.getElementById('bulkNoWaiting').checked = false;
        document.getElementById('bulkIsParkingSpot').checked = false;
        document.getElementById('bulkMaxRobots').value = '';

        modal.style.display = 'block';
    }

    applyBulkEdit() {
        this.saveState();

        const nodeType = document.getElementById('bulkNodeType').value;
        const noWaiting = document.getElementById('bulkNoWaiting').checked;
        const isParkingSpot = document.getElementById('bulkIsParkingSpot').checked;
        const maxRobots = document.getElementById('bulkMaxRobots').value;

        this.selectedNodes.forEach(node => {
            if (nodeType) {
                node.type = nodeType;
            }
            if (noWaiting) {
                node.noWaiting = true;
            }
            if (isParkingSpot) {
                node.isParkingSpot = true;
            }
            if (maxRobots) {
                node.maxRobots = parseInt(maxRobots);
            }
        });

        this.showToast(`Updated ${this.selectedNodes.length} nodes`);
    }


    // === GRAPH VALIDATION ===
    validateGraph() {
        const issues = [];

        // Check for disconnected nodes
        const connectedNodes = new Set();
        this.paths.forEach(path => {
            connectedNodes.add(path.from);
            connectedNodes.add(path.to);
        });

        const disconnectedNodes = this.nodes.filter(node => !connectedNodes.has(node.id));
        if (disconnectedNodes.length > 0) {
            issues.push({
                type: 'warning',
                title: 'Disconnected Nodes',
                description: `${disconnectedNodes.length} node(s) have no paths: ${disconnectedNodes.map(n => n.name).join(', ')}`
            });
        }

        // Check for overlapping nodes
        const overlaps = [];
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dx = this.nodes[i].x - this.nodes[j].x;
                const dy = this.nodes[i].y - this.nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 10) { // Less than 10 pixels apart
                    overlaps.push(`${this.nodes[i].name} and ${this.nodes[j].name}`);
                }
            }
        }

        if (overlaps.length > 0) {
            issues.push({
                type: 'error',
                title: 'Overlapping Nodes',
                description: `${overlaps.length} pair(s) of nodes are too close: ${overlaps.join(', ')}`
            });
        }

        // Check for duplicate paths
        const pathKeys = new Set();
        const duplicates = [];

        this.paths.forEach(path => {
            const key1 = `${path.from}-${path.to}`;
            const key2 = `${path.to}-${path.from}`;

            if (pathKeys.has(key1) || (path.bidirectional && pathKeys.has(key2))) {
                duplicates.push(`${path.name}`);
            }

            pathKeys.add(key1);
            if (path.bidirectional) {
                pathKeys.add(key2);
            }
        });

        if (duplicates.length > 0) {
            issues.push({
                type: 'warning',
                title: 'Duplicate Paths',
                description: `${duplicates.length} duplicate path(s) found: ${duplicates.join(', ')}`
            });
        }

        // Check for nodes with duplicate names
        const nameCount = {};
        this.nodes.forEach(node => {
            nameCount[node.name] = (nameCount[node.name] || 0) + 1;
        });

        const duplicateNames = Object.keys(nameCount).filter(name => nameCount[name] > 1);
        if (duplicateNames.length > 0) {
            issues.push({
                type: 'error',
                title: 'Duplicate Node Names',
                description: `${duplicateNames.length} duplicate name(s): ${duplicateNames.join(', ')}`
            });
        }

        // Display results
        const modal = document.getElementById('validationModal');
        const resultsDiv = document.getElementById('validationResults');

        if (issues.length === 0) {
            resultsDiv.innerHTML = '<div style="color: #28a745; padding: 20px; text-align: center;"><h3>✓ Graph is valid!</h3><p>No issues found.</p></div>';
        } else {
            resultsDiv.innerHTML = issues.map(issue => {
                const color = issue.type === 'error' ? '#dc3545' : '#ffc107';
                return `
                    <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid ${color}; background-color: rgba(255,255,255,0.05);">
                        <h4 style="color: ${color}; margin-bottom: 5px;">${issue.type === 'error' ? '✗' : '⚠'} ${issue.title}</h4>
                        <p style="color: #e0e0e0; font-size: 13px;">${issue.description}</p>
                    </div>
                `;
            }).join('');
        }

        modal.style.display = 'block';
    }

    // === RECENT FILES ===
    loadRecentFiles() {
        try {
            const stored = localStorage.getItem('fleetGraphWizard_recentFiles');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading recent files:', error);
            return [];
        }
    }

    saveToRecentFiles(filename, mapYaml) {
        try {
            const entry = {
                filename: filename,
                timestamp: new Date().toISOString(),
                mapYaml: mapYaml
            };

            // Remove if already exists
            this.recentFiles = this.recentFiles.filter(f => f.filename !== filename);

            // Add to front
            this.recentFiles.unshift(entry);

            // Keep only last 10
            this.recentFiles = this.recentFiles.slice(0, 10);

            // Save to localStorage
            localStorage.setItem('fleetGraphWizard_recentFiles', JSON.stringify(this.recentFiles));
        } catch (error) {
            console.error('Error saving recent files:', error);
        }
    }

    clearRecentFiles() {
        this.recentFiles = [];
        localStorage.removeItem('fleetGraphWizard_recentFiles');
        this.showToast('Recent files cleared');
        this.showRecentFilesDropdown(); // Refresh the dropdown
    }

    showRecentFilesDropdown() {
        const dropdown = document.getElementById('recentFilesDropdown');
        const button = document.getElementById('recentFilesBtn');
        const rect = button.getBoundingClientRect();

        dropdown.style.top = (rect.bottom + 5) + 'px';
        dropdown.style.left = rect.left + 'px';

        if (this.recentFiles.length === 0) {
            dropdown.innerHTML = '<div class="dropdown-empty">No recent files</div>';
        } else {
            dropdown.innerHTML = this.recentFiles.map(file => {
                const date = new Date(file.timestamp);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

                return `
                    <div class="dropdown-item" data-filename="${file.filename}">
                        <div class="dropdown-item-title">${file.filename}</div>
                        <div class="dropdown-item-subtitle">${dateStr}</div>
                    </div>
                `;
            }).join('') + `
                <div class="dropdown-item" onclick="app.clearRecentFiles()" style="border-top: 2px solid #555; color: #ff6b6b;">
                    <div class="dropdown-item-title">Clear Recent Files</div>
                </div>
            `;

            // Add click handlers to items
            setTimeout(() => {
                dropdown.querySelectorAll('.dropdown-item[data-filename]').forEach(item => {
                    item.addEventListener('click', () => {
                        const filename = item.getAttribute('data-filename');
                        this.showToast(`Recent file info: ${filename}. Note: You still need to load the files manually.`, 4000);
                        dropdown.style.display = 'none';
                    });
                });
            }, 0);
        }

        dropdown.style.display = 'block';
    }

    // === SEARCH ===
    handleSearch(query) {
        if (!query || query.length < 2) {
            this.searchResults = [];
            this.render();
            return;
        }

        const lowerQuery = query.toLowerCase();

        // Search nodes
        const matchingNodes = this.nodes.filter(node =>
            node.name.toLowerCase().includes(lowerQuery)
        );

        // Search paths
        const matchingPaths = this.paths.filter(path =>
            path.name.toLowerCase().includes(lowerQuery)
        );

        this.searchResults = {
            nodes: matchingNodes,
            paths: matchingPaths
        };

        // Highlight matching nodes
        if (matchingNodes.length > 0) {
            this.selectedNodes = matchingNodes;
            this.updateStatus(`Found ${matchingNodes.length} node(s) and ${matchingPaths.length} path(s)`);
        } else if (matchingPaths.length > 0) {
            this.updateStatus(`Found ${matchingPaths.length} path(s)`);
        } else {
            this.selectedNodes = [];
            this.updateStatus('No results found');
        }

        this.render();
    }

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }

    updateSelectionCount() {
        const selectionText = document.getElementById('selectionText');
        if (selectionText) {
            const count = this.selectedNodes.length;
            if (count > 0) {
                selectionText.textContent = `Selected: ${count}`;
                selectionText.style.display = 'inline';
            } else {
                selectionText.style.display = 'none';
            }
        }
    }
}

// Initialize app when DOM is loaded
let app; // Global app instance
document.addEventListener('DOMContentLoaded', () => {
    app = new FleetGraphWizard();
    window.app = app; // Make it accessible globally for onclick handlers
});
