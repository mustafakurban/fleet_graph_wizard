/**
 * Parser Registry
 *
 * This file registers all available parsers for the Fleet Graph Wizard.
 * To add a new parser:
 * 1. Create your parser class extending BaseParser
 * 2. Import it below
 * 3. Add it to the parsers array
 */

// Import all parser classes
// Note: In browser environment, these will be loaded via script tags in index.html

/**
 * Get all registered parsers
 * @returns {BaseParser[]} Array of parser instances
 */
function getAllParsers() {
    const parsers = [];

    // Add built-in parsers
    if (typeof JSONParser !== 'undefined') {
        parsers.push(new JSONParser());
    }

    if (typeof CSVParser !== 'undefined') {
        parsers.push(new CSVParser());
    }

    if (typeof SQLiteParser !== 'undefined') {
        parsers.push(new SQLiteParser());
    }

    // Add your custom parsers here
    // Example:
    // if (typeof MyCustomParser !== 'undefined') {
    //     parsers.push(new MyCustomParser());
    // }

    return parsers;
}

/**
 * Get parser by ID
 * @param {string} parserId - Parser ID
 * @returns {BaseParser|null} Parser instance or null if not found
 */
function getParserById(parserId) {
    const parsers = getAllParsers();
    return parsers.find(p => p.id === parserId) || null;
}

/**
 * Get default parser (JSON)
 * @returns {BaseParser} Default parser instance
 */
function getDefaultParser() {
    const parsers = getAllParsers();
    return parsers.find(p => p.id === 'json') || parsers[0];
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAllParsers,
        getParserById,
        getDefaultParser
    };
}
