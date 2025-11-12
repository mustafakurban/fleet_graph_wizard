/**
 * MapManager - Handles all map-related operations
 *
 * Responsibilities:
 * - Loading map files (PNG/PGM + YAML)
 * - Managing map image and metadata
 * - Coordinate transformations (canvas ↔ world coordinates)
 * - Map rendering
 * - Recent files management
 */
class MapManager {
    constructor() {
        // Map state
        this.mapImage = null;
        this.mapYaml = null;

        // Recent files
        this.recentFiles = this.loadRecentFiles();
    }

    /**
     * Load map files (image + YAML)
     * @param {FileList} files - Selected files
     */
    async loadMapFiles(files) {
        if (files.length === 0) return;

        let yamlFile = null;
        let imageFile = null;

        // Identify YAML and image files
        for (const file of files) {
            const ext = file.name.split('.').pop().toLowerCase();
            if (ext === 'yaml' || ext === 'yml') {
                yamlFile = file;
            } else if (ext === 'pgm' || ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
                imageFile = file;
            }
        }

        if (!yamlFile) {
            alert('Please select a YAML file containing map metadata');
            return;
        }

        try {
            // Parse YAML file
            const text = await yamlFile.text();
            this.mapYaml = jsyaml.load(text);
            console.log('Parsed YAML:', this.mapYaml);

            // Check if YAML specifies an image file
            let expectedImageName = null;
            if (this.mapYaml.image) {
                expectedImageName = this.mapYaml.image;
                console.log('YAML expects image:', expectedImageName);

                // If no image was selected but YAML specifies one, prompt user
                if (!imageFile) {
                    alert(`The YAML file references an image file: ${expectedImageName}\nPlease select this image file along with the YAML.`);
                    this.saveToRecentFiles(yamlFile.name, this.mapYaml);
                    return;
                }

                // Check if selected image matches
                if (imageFile.name !== expectedImageName) {
                    const proceed = confirm(
                        `Warning: Selected image "${imageFile.name}" does not match ` +
                        `the image specified in YAML "${expectedImageName}".\n\n` +
                        `Do you want to proceed anyway?`
                    );
                    if (!proceed) {
                        this.saveToRecentFiles(yamlFile.name, this.mapYaml);
                        return;
                    }
                }
            }

            // Load image
            if (imageFile) {
                await this.loadImageFile(imageFile);
                this.saveToRecentFiles(yamlFile.name, this.mapYaml);
                return { success: true, message: 'Map loaded successfully' };
            } else {
                alert('Please select an image file (PNG or PGM)');
                return { success: false, message: 'No image file selected' };
            }

        } catch (error) {
            console.error('Error loading map files:', error);
            alert('Error loading map: ' + error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Load image file
     * @param {File} file - Image file
     */
    async loadImageFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === 'pgm') {
            // Handle PGM format
            const arrayBuffer = await file.arrayBuffer();
            const imageData = this.parsePGM(arrayBuffer);
            const canvas = document.createElement('canvas');
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(imageData.imageData, 0, 0);

            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const img = new Image();
                    img.onload = () => {
                        this.mapImage = img;
                        URL.revokeObjectURL(url);
                        resolve();
                    };
                    img.onerror = reject;
                    img.src = url;
                });
            });
        } else {
            // Handle PNG/JPG
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        this.mapImage = img;
                        resolve();
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
    }

    /**
     * Parse PGM image format
     * @param {ArrayBuffer} arrayBuffer - PGM file data
     */
    parsePGM(arrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer);
        let offset = 0;

        // Read header
        let header = '';
        while (offset < bytes.length) {
            const char = String.fromCharCode(bytes[offset++]);
            header += char;
            if (header.includes('\n') && !header.trim().startsWith('#')) {
                break;
            }
        }

        // Parse dimensions
        let line = '';
        while (offset < bytes.length) {
            const char = String.fromCharCode(bytes[offset++]);
            if (char === '\n') {
                if (line.trim() && !line.trim().startsWith('#')) break;
                line = '';
            } else {
                line += char;
            }
        }

        const [width, height] = line.trim().split(/\s+/).map(Number);

        // Skip max value line
        while (offset < bytes.length && bytes[offset++] !== 10); // 10 is newline

        // Read pixel data
        const imageData = new ImageData(width, height);
        for (let i = 0; i < width * height; i++) {
            const val = bytes[offset++];
            imageData.data[i * 4] = val;
            imageData.data[i * 4 + 1] = val;
            imageData.data[i * 4 + 2] = val;
            imageData.data[i * 4 + 3] = 255;
        }

        return { width, height, imageData };
    }

    /**
     * Convert canvas coordinates to world coordinates
     * @param {number} canvasX - Canvas X coordinate
     * @param {number} canvasY - Canvas Y coordinate
     * @returns {Object} World coordinates {x, y}
     */
    getWorldCoordinates(canvasX, canvasY) {
        if (!this.mapYaml) return { x: canvasX, y: canvasY };

        const resolution = this.mapYaml.resolution;
        const origin = this.mapYaml.origin || [0, 0, 0];

        return {
            x: canvasX * resolution + origin[0],
            y: (this.mapImage.height - canvasY) * resolution + origin[1]
        };
    }

    /**
     * Convert world coordinates to canvas coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Canvas coordinates {x, y}
     */
    getCanvasCoordinates(worldX, worldY) {
        if (!this.mapYaml) return { x: worldX, y: worldY };

        const resolution = this.mapYaml.resolution;
        const origin = this.mapYaml.origin || [0, 0, 0];

        return {
            x: (worldX - origin[0]) / resolution,
            y: this.mapImage.height - (worldY - origin[1]) / resolution
        };
    }

    /**
     * Get map info string for display
     * @returns {string} Map information
     */
    getMapInfoString() {
        if (!this.mapYaml) return 'No map loaded';

        const origin = this.mapYaml.origin || [0, 0, 0];
        return `Resolution: ${this.mapYaml.resolution}m/px | Origin: [${origin[0]}, ${origin[1]}, ${origin[2]}] | ` +
               `Negate: ${this.mapYaml.negate || 0} | Free: ${this.mapYaml.free_thresh || 'N/A'} | ` +
               `Occupied: ${this.mapYaml.occupied_thresh || 'N/A'}`;
    }

    /**
     * Check if map is loaded
     * @returns {boolean} True if map is loaded
     */
    isMapLoaded() {
        return this.mapImage !== null;
    }

    /**
     * Get map dimensions
     * @returns {Object} Map dimensions {width, height}
     */
    getMapDimensions() {
        if (!this.mapImage) return { width: 0, height: 0 };
        return { width: this.mapImage.width, height: this.mapImage.height };
    }

    /**
     * Get map resolution (meters per pixel)
     * @returns {number|null} Resolution or null if no map
     */
    getMapResolution() {
        return this.mapYaml?.resolution || null;
    }

    /**
     * Save to recent files
     * @param {string} fileName - File name
     * @param {Object} mapYaml - Map YAML data
     */
    saveToRecentFiles(fileName, mapYaml) {
        const recentFile = {
            fileName: fileName,
            timestamp: Date.now(),
            mapYaml: mapYaml
        };

        // Remove existing entry if present
        this.recentFiles = this.recentFiles.filter(f => f.fileName !== fileName);

        // Add to beginning
        this.recentFiles.unshift(recentFile);

        // Keep only last 10
        this.recentFiles = this.recentFiles.slice(0, 10);

        // Save to localStorage
        try {
            localStorage.setItem('fleetGraphWizard_recentFiles', JSON.stringify(this.recentFiles));
        } catch (error) {
            console.warn('Could not save to localStorage:', error);
        }
    }

    /**
     * Load recent files from localStorage
     * @returns {Array} Recent files
     */
    loadRecentFiles() {
        try {
            const stored = localStorage.getItem('fleetGraphWizard_recentFiles');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Could not load recent files:', error);
            return [];
        }
    }

    /**
     * Get recent files list
     * @returns {Array} Recent files
     */
    getRecentFiles() {
        return this.recentFiles;
    }

    /**
     * Clear recent files
     */
    clearRecentFiles() {
        this.recentFiles = [];
        try {
            localStorage.removeItem('fleetGraphWizard_recentFiles');
        } catch (error) {
            console.warn('Could not clear recent files:', error);
        }
    }

    /**
     * Render map on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (this.mapImage) {
            ctx.drawImage(this.mapImage, 0, 0);
        }
    }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapManager;
}
