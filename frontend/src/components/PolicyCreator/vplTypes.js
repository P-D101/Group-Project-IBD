// Shared helpers for mapping between template VPL blocks, library blocks, and
// the flowchart representation used by the canvas. This is plain JS so it can
// be imported from both components and pages.

let nodeIdCounter = 1;

export function createNodeId(prefix = "node") {
    nodeIdCounter += 1;
    return `${prefix}-${nodeIdCounter}`;
}

/**
 * Create a basic VPL node (React Flow node shape) from a block definition.
 * This is used both for template blocks and library blocks.
 */
export function createNodeFromBlock(block, position) {
    const id = createNodeId(block.id || block.type || "node");

    const baseTicket = block.ticket || {
        recipient: "",
        action: "",
        description: "",
    };

    return {
        id,
        type: block.type || "default",
        position: position || { x: 0, y: 0 },
        data: {
            // Block identity / label
            blockId: block.id || id,
            type: block.type || "default",
            label: block.label || "",
            value: block.value,
            // Ticket metadata used by BlockPropertiesPanel
            ticket: {
                recipient: baseTicket.recipient || "",
                action: baseTicket.action || "",
                description: baseTicket.description || "",
            },
        },
    };
}

/**
 * Map a template's vplBlocks array into an initial set of nodes arranged in a
 * simple horizontal layout. Edges can be generated separately if desired.
 */
export function templateBlocksToNodes(vplBlocks, origin = { x: 0, y: 0 }) {
    if (!Array.isArray(vplBlocks)) return [];

    const spacingX = 220;
    const baseY = origin.y;

    return vplBlocks.map((block, index) => {
        const position = {
            x: origin.x + index * spacingX,
            y: baseY,
        };
        return createNodeFromBlock(block, position);
    });
}

/**
 * Given an array of nodes, return a shallow VPL blocks representation that
 * mirrors the template shape. This is mainly for future export and not used
 * heavily yet in the UI.
 */
export function nodesToVplBlocks(nodes) {
    if (!Array.isArray(nodes)) return [];

    return nodes.map((node) => ({
        id: node.data.blockId,
        type: node.data.type,
        label: node.data.label,
        value: node.data.value,
        ticket: {
            recipient: node.data.ticket?.recipient || "",
            action: node.data.ticket?.action || "",
            description: node.data.ticket?.description || "",
        },
    }));
}

