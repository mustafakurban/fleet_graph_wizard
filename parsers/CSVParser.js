/**
 * CSVParser - Example parser for CSV format graphs
 *
 * This parser demonstrates how to create a custom parser for a different format.
 * CSV Format specification:
 *
 * NODES section:
 * id,name,x,y,type,maxRobots,parkingSpot,noWaiting
 * node1,Entrance,5.0,3.2,normal,2,false,false
 * node2,Charging Bay,10.5,8.1,charging,1,true,false
 *
 * PATHS section:
 * id,name,from,to,bidirectional,speedLimit,width
 * path1,Main Corridor,node1,node2,true,1.5,0.8
 * path2,,node2,node3,false,2.0,1.0
 */
class CSVParser extends BaseParser {
    constructor() {
        super(
            'CSV Graph Format',
            'csv',
            ['.csv', '.txt'],
            'Comma-separated values format with NODES and PATHS sections'
        );
    }

    /**
     * Parse CSV file content
     * @param {string} fileContent - Raw CSV file content
     * @param {string} fileName - Original file name
     * @returns {Promise<Object>} Standardized graph object
     */
    async parse(fileContent, fileName) {
        try {
            const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);

            let currentSection = null;
            const nodes = [];
            const paths = [];

            let nodeHeaders = [];
            let pathHeaders = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Check for section headers
                if (line.toUpperCase() === 'NODES' || line.toUpperCase() === '[NODES]') {
                    currentSection = 'NODES';
                    continue;
                } else if (line.toUpperCase() === 'PATHS' || line.toUpperCase() === '[PATHS]') {
                    currentSection = 'PATHS';
                    continue;
                }

                // Parse data based on current section
                if (currentSection === 'NODES') {
                    if (nodeHeaders.length === 0) {
                        // First line after NODES is the header
                        nodeHeaders = this.parseCSVLine(line);
                    } else {
                        // Parse node data
                        const values = this.parseCSVLine(line);
                        if (values.length > 0 && values[0]) {
                            const node = this.parseNodeFromCSV(nodeHeaders, values);
                            nodes.push(node);
                        }
                    }
                } else if (currentSection === 'PATHS') {
                    if (pathHeaders.length === 0) {
                        // First line after PATHS is the header
                        pathHeaders = this.parseCSVLine(line);
                    } else {
                        // Parse path data
                        const values = this.parseCSVLine(line);
                        if (values.length > 0 && values[0]) {
                            const path = this.parsePathFromCSV(pathHeaders, values);
                            paths.push(path);
                        }
                    }
                }
            }

            // Create standardized graph data
            const graphData = {
                metadata: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    importedFrom: fileName,
                    sourceFormat: 'CSV'
                },
                nodes: nodes,
                paths: paths
            };

            // Validate the parsed data
            const validation = this.validate(graphData);
            if (!validation.valid) {
                throw new Error(`Invalid graph data:\n${validation.errors.join('\n')}`);
            }

            return graphData;

        } catch (error) {
            throw new Error(`CSV parsing error: ${error.message}`);
        }
    }

    /**
     * Parse a CSV line, handling quoted values
     * @param {string} line - CSV line
     * @returns {string[]} Array of values
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        // Add last field
        values.push(current.trim());

        return values;
    }

    /**
     * Parse node data from CSV values
     * @param {string[]} headers - Column headers
     * @param {string[]} values - Row values
     * @returns {Object} Node object
     */
    parseNodeFromCSV(headers, values) {
        const node = {
            id: '',
            name: '',
            x: 0,
            y: 0,
            type: 'normal',
            maxRobots: 1,
            parkingSpot: false,
            noWaiting: false
        };

        for (let i = 0; i < headers.length && i < values.length; i++) {
            const header = headers[i].toLowerCase();
            const value = values[i];

            switch (header) {
                case 'id':
                    node.id = value;
                    break;
                case 'name':
                    node.name = value;
                    break;
                case 'x':
                    node.x = parseFloat(value) || 0;
                    break;
                case 'y':
                    node.y = parseFloat(value) || 0;
                    break;
                case 'type':
                    node.type = value || 'normal';
                    break;
                case 'maxrobots':
                case 'max_robots':
                    node.maxRobots = parseInt(value) || 1;
                    break;
                case 'parkingspot':
                case 'parking_spot':
                    node.parkingSpot = this.parseBoolean(value);
                    break;
                case 'nowaiting':
                case 'no_waiting':
                    node.noWaiting = this.parseBoolean(value);
                    break;
            }
        }

        // Use ID as name if name is empty
        if (!node.name && node.id) {
            node.name = node.id;
        }

        return node;
    }

    /**
     * Parse path data from CSV values
     * @param {string[]} headers - Column headers
     * @param {string[]} values - Row values
     * @returns {Object} Path object
     */
    parsePathFromCSV(headers, values) {
        const path = {
            id: '',
            name: '',
            from: '',
            to: '',
            bidirectional: false,
            speedLimit: null,
            width: null
        };

        for (let i = 0; i < headers.length && i < values.length; i++) {
            const header = headers[i].toLowerCase();
            const value = values[i];

            switch (header) {
                case 'id':
                    path.id = value;
                    break;
                case 'name':
                    path.name = value || '';
                    break;
                case 'from':
                case 'source':
                case 'start':
                    path.from = value;
                    break;
                case 'to':
                case 'target':
                case 'end':
                    path.to = value;
                    break;
                case 'bidirectional':
                case 'bi':
                case 'twoway':
                    path.bidirectional = this.parseBoolean(value);
                    break;
                case 'speedlimit':
                case 'speed_limit':
                case 'speed':
                    const speed = parseFloat(value);
                    path.speedLimit = isNaN(speed) ? null : speed;
                    break;
                case 'width':
                    const width = parseFloat(value);
                    path.width = isNaN(width) ? null : width;
                    break;
            }
        }

        return path;
    }

    /**
     * Parse boolean value from string
     * @param {string} value - String value
     * @returns {boolean} Boolean value
     */
    parseBoolean(value) {
        const lower = value.toLowerCase();
        return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'y';
    }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSVParser;
}
