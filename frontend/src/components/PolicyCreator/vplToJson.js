// vplToJson.js
// Utility to convert a VPL flowchart object to JSON and trigger a download

/**
 * Converts a VPL flowchart object to JSON and triggers a file download.
 * @param {Object} vplObject - The VPL flowchart/template object to export.
 * @param {string} [filename] - Optional filename for the download (default: 'policy.json').
 */
export function exportVplToJson(vplObject, filename = 'policy.json') {
    if (!vplObject) {
        alert('No VPL object provided to export.');
        return;
    }
    const json = JSON.stringify(vplObject, null, 2);
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
