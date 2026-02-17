// vplToJson.js
// Utility to convert a VPL flowchart object to JSON and trigger a download

/**
 * Converts a VPL flowchart object to JSON and triggers a file download.
 * @param {Object} vplObject - The VPL flowchart/template object to export.
 * @param {string} [filename] - Optional filename for the download (default: 'policy.json').
 */

/**
 * Transforms a VPL flowchart object to the new schema with explicit block IDs, types, and input references.
 * @param {Object} vplObject - The VPL flowchart/template object to export.
 * @returns {Object} - The transformed VPL JSON object.
 */
export function transformVplToSchema(vplObject) {
    if (!vplObject || !vplObject.vplBlocks) return { blocks: [] };
    // This assumes each block has id, type, label, value, and a list of input block ids (inputs)
    // You may need to adapt this if your editor uses a different structure
    const blocks = vplObject.vplBlocks.map(block => {
        const {
            id,
            type,
            label,
            value,
            inputs = [],
            outputType,
            outputData,
            ticket,
            ...rest
        } = block;
        // For output blocks, move ticket to outputData if present
        let outData = outputData;
        if (!outData && ticket) outData = ticket;
        return {
            id,
            type,
            label,
            value,
            inputs,
            outputType,
            outputData: outData,
            ...rest
        };
    });
    return { blocks };
}

/**
 * Converts a VPL flowchart object to JSON (new schema) and triggers a file download.
 * @param {Object} vplObject - The VPL flowchart/template object to export.
 * @param {string} [filename] - Optional filename for the download (default: 'policy.json').
 */
export function exportVplToJson(vplObject, filename = 'policy.json') {
    if (!vplObject) {
        alert('No VPL object provided to export.');
        return;
    }
    const schemaObj = transformVplToSchema(vplObject);
    const json = JSON.stringify(schemaObj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
