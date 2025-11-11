// Fleet Graph Wizard - Main Application
class FleetGraphWizard {
    constructor() {
        this.canvas = document.getElementById('mapCanvas');
        this.ctx = this.canvas.getContext('2d');

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

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.disableTools();
        this.render();
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
            document.getElementById('jsonInput').click();
        });

        document.getElementById('jsonInput').addEventListener('change', (e) => {
            this.importJson(e.target.files[0]);
        });

        document.getElementById('exportJsonBtn').addEventListener('click', () => {
            this.exportJson();
        });

        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTool = e.target.dataset.tool;
                this.pathStart = null;
                this.tempPathEnd = null;
                this.updateStatus(`Tool: ${this.currentTool}`);
                this.render();
            });
        });

        // View controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('resetViewBtn').addEventListener('click', () => this.resetView());

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

        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));

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

        // Check if clicking on a node in select mode - enable dragging
        if (this.currentTool === 'select') {
            const clickedNode = this.findNodeAt(point);
            if (clickedNode) {
                this.isDraggingNode = true;
                this.draggedNode = clickedNode;
                this.canvas.style.cursor = 'move';
                return;
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
                this.handleSelection(point);
                break;
            case 'delete':
                this.handleDeletion(point);
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
            this.draggedNode.x = point.x;
            this.draggedNode.y = point.y;
            this.render();
            return;
        }

        // Handle temporary path preview
        if (this.currentTool === 'path' && this.pathStart) {
            this.tempPathEnd = point;
            this.render();
            return;
        }

        // Show cursor feedback when hovering over nodes in select mode
        if (this.currentTool === 'select') {
            const hoveredNode = this.findNodeAt(point);
            if (hoveredNode) {
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

        this.render();
    }

    zoom(factor) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const point = this.getCanvasPoint(centerX, centerY);

        this.offset.x = centerX - (point.x * this.scale * factor);
        this.offset.y = centerY - (point.y * this.scale * factor);
        this.scale *= factor;

        this.render();
    }

    resetView() {
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.render();
    }

    addNode(point) {
        const node = {
            id: `node_${this.nodeCounter++}`,
            name: `Node ${this.nodeCounter - 1}`,
            x: point.x,
            y: point.y,
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

    handleSelection(point) {
        // Try to select node first
        const node = this.findNodeAt(point);
        if (node) {
            this.selectedNode = node;
            this.showNodeModal();
            return;
        }

        // Try to select path
        const path = this.findPathAt(point);
        if (path) {
            this.selectedPath = path;
            this.showPathModal();
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

    findNodeAt(point, radius = 15) {
        return this.nodes.find(node => {
            const dx = node.x - point.x;
            const dy = node.y - point.y;
            return Math.sqrt(dx * dx + dy * dy) < radius;
        });
    }

    findPathAt(point, threshold = 10) {
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

        this.selectedPath.name = document.getElementById('pathName').value;
        this.selectedPath.speedLimit = parseFloat(document.getElementById('pathSpeed').value);
        this.selectedPath.bidirectional = document.getElementById('isBidirectional').checked;
        this.selectedPath.width = parseFloat(document.getElementById('pathWidth').value);
        this.selectedPath.notes = document.getElementById('pathNotes').value;
    }

    exportJson() {
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
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fleet_graph_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.updateStatus('Graph exported successfully');
    }

    async importJson(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            this.nodes = data.nodes || [];
            this.paths = data.paths || [];

            if (data.metadata?.mapYaml) {
                this.mapYaml = data.metadata.mapYaml;
                this.updateMapInfo();
            }

            // Update node counter
            this.nodeCounter = this.nodes.length + 1;

            // Enable tools if we have nodes/paths to work with
            if (this.nodes.length > 0 || this.paths.length > 0) {
                this.enableTools();
            }

            this.updateStatus(`Imported ${this.nodes.length} nodes and ${this.paths.length} paths`);
            this.render();
        } catch (error) {
            console.error('Error importing JSON:', error);
            alert('Error importing JSON: ' + error.message);
        }
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
        }

        // Draw nodes
        this.nodes.forEach(node => this.drawNode(node));

        ctx.restore();
    }

    drawNode(node) {
        const ctx = this.ctx;
        const radius = 10;

        // Draw node circle (if enabled)
        if (this.showNodePoints) {
            // Node color based on type
            let color;
            switch (node.type) {
                case 'charging': color = '#28a745'; break;
                case 'pickup': color = '#ffc107'; break;
                case 'dropoff': color = '#17a2b8'; break;
                default: color = '#007acc';
            }

            ctx.fillStyle = color;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw indicators
            if (node.noWaiting) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(node.x - radius - 3, node.y - radius - 3);
                ctx.lineTo(node.x + radius + 3, node.y + radius + 3);
                ctx.stroke();
            }

            if (node.isParkingSpot) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('P', node.x - 4, node.y + 4);
            }
        }

        // Draw name with background for better visibility (if enabled)
        if (this.showNodeNames) {
            ctx.font = 'bold 13px Arial';
            const textWidth = ctx.measureText(node.name).width;
            const textHeight = 13;
            const padding = 4;

            // Draw background rectangle
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
                node.x + radius + 3,
                node.y - radius - textHeight - padding,
                textWidth + padding * 2,
                textHeight + padding * 2
            );

            // Draw text
            ctx.fillStyle = '#ffff00'; // Yellow for better visibility
            ctx.fillText(node.name, node.x + radius + 5, node.y - radius);
        }
    }

    drawPath(path) {
        const fromNode = this.nodes.find(n => n.id === path.from);
        const toNode = this.nodes.find(n => n.id === path.to);

        if (!fromNode || !toNode) return;

        const ctx = this.ctx;

        // Draw path line (if enabled)
        if (this.showPathLines) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.stroke();

            // Draw arrow
            this.drawArrow(fromNode, toNode);

            // Draw reverse arrow if bidirectional
            if (path.bidirectional) {
                this.drawArrow(toNode, fromNode);
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

    drawArrow(from, to) {
        const ctx = this.ctx;
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowLength = 15;
        const arrowWidth = 8;

        // Position arrow near the end
        const arrowX = to.x - Math.cos(angle) * 15;
        const arrowY = to.y - Math.sin(angle) * 15;

        ctx.fillStyle = '#00ff00';
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

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }
}

// Initialize app when DOM is loaded
let app; // Global app instance
document.addEventListener('DOMContentLoaded', () => {
    app = new FleetGraphWizard();
    window.app = app; // Make it accessible globally for onclick handlers
});
