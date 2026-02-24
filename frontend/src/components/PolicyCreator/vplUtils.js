// Shared helpers for mapping between template VPL blocks, library blocks, and
// the flowchart representation used by the canvas. This is plain JS so it can
// be imported from both components and pages.

import { MarkerType } from "@xyflow/system";

let nodeIdCounter = 1;

export function createNodeId() {
    nodeIdCounter += 1;
    return `${nodeIdCounter}`;
}

function vplToFlowType(type) {
    // Map from flowType string to array of VPL block types
    const flowTypeToVplTypes = [
        {
            flowType: "default",
            vplTypes: ["add", "subtract", "multiply", "divide"],
        },
        { flowType: "input", vplTypes: ["input", "const"] },
        { flowType: "output", vplTypes: ["output", "ticket"] },
        { flowType: "default", vplTypes: ["lt", "gt", "eq", "and", "or"] },
    ];
    for (const { flowType, vplTypes } of flowTypeToVplTypes) {
        if (vplTypes.includes(type)) {
            console.log("found");
            return flowType;
        }
    }
}

export function createNodeFromBlock(block, position) {
    // Prefer a stable id from the block (used for templates)
    const id =
        block && block.id !== undefined && block.id !== null
            ? String(block.id)
            : createNodeId();

    const baseTicket = block.ticket || {
        recipient: "",
        action: "",
    };

    return {
        id,
        type: vplToFlowType(block.type),
        position: position || { x: 0, y: 0 },
        data: {
            id,
            position,
            type: block.type,
            label: block.label,
            description: block.description,
            payload:
                block.type == "ticket"
                    ? baseTicket
                    : block.type == "const"
                      ? { value: 0 }
                      : {},
        },
    };
}

export function templateBlocksToNodes(
    templateBlocks,
    templateEdges = [],
    origin = { x: 0, y: 0 },
) {
    if (!Array.isArray(templateBlocks)) return [];

    // Horizontal spacing between nodes in the same layer
    const spacingX = 220;
    // Vertical spacing between dependency layers (data flows downwards)
    const spacingY = 140;

    // Build a stable list of node ids (as strings) from the blocks
    const nodeIds = templateBlocks.map((block, index) => {
        // Fall back to index-based id if block.id is not present
        const rawId =
            block && block.id !== undefined && block.id !== null
                ? block.id
                : index;
        return String(rawId);
    });

    // Map id -> block for convenient lookup when creating nodes
    const idToBlock = {};
    nodeIds.forEach((id, index) => {
        idToBlock[id] = templateBlocks[index];
    });

    // Build adjacency lists for outgoing and incoming edges
    const outgoing = {};
    const incoming = {};
    nodeIds.forEach((id) => {
        outgoing[id] = [];
        incoming[id] = [];
    });

    if (Array.isArray(templateEdges)) {
        templateEdges.forEach(([source, target]) => {
            const s = String(source);
            const t = String(target);
            if (outgoing[s] && incoming[t]) {
                outgoing[s].push(t);
                incoming[t].push(s);
            }
        });
    }

    // Topological sort using DFS (similar to the cycle detection approach)
    const visited = {};
    const tempMark = {};
    const postOrder = [];

    function dfs(nodeId) {
        if (tempMark[nodeId]) {
            // We expect a DAG here; if a cycle exists, just stop recursion to avoid infinite loops.
            return;
        }
        if (visited[nodeId]) return;

        tempMark[nodeId] = true;
        for (const neighbor of outgoing[nodeId]) {
            dfs(neighbor);
        }
        tempMark[nodeId] = false;
        visited[nodeId] = true;
        postOrder.push(nodeId);
    }

    // Run DFS from every node to ensure disconnected components are included
    for (const nodeId of nodeIds) {
        if (!visited[nodeId]) {
            dfs(nodeId);
        }
    }

    // Reverse post-order gives us a topological ordering
    const topoOrder = postOrder.reverse();
    const topoIndex = {};
    topoOrder.forEach((id, index) => {
        topoIndex[id] = index;
    });

    // Compute layer for each node: layer = max(layer of predecessors) + 1
    const layerById = {};
    for (const nodeId of topoOrder) {
        const preds = incoming[nodeId];
        if (!preds || preds.length === 0) {
            layerById[nodeId] = 0;
        } else {
            let maxPredLayer = 0;
            preds.forEach((p) => {
                const lp = layerById[p] !== undefined ? layerById[p] : 0;
                if (lp > maxPredLayer) maxPredLayer = lp;
            });
            layerById[nodeId] = maxPredLayer + 1;
        }
    }

    // Group nodes by layer
    const layers = {};
    nodeIds.forEach((id) => {
        const layer = layerById[id] !== undefined ? layerById[id] : 0;
        if (!layers[layer]) layers[layer] = [];
        layers[layer].push(id);
    });

    // Sort nodes within each layer by their topological index for a stable layout
    Object.keys(layers).forEach((layerKey) => {
        layers[layerKey].sort((a, b) => {
            return (topoIndex[a] || 0) - (topoIndex[b] || 0);
        });
    });

    // Create nodes with positions based on their layer and index within the layer.
    // Nodes in each layer are horizontally centered around the origin.x.
    const nodes = [];
    Object.keys(layers)
        .map((key) => Number(key))
        .sort((a, b) => a - b)
        .forEach((layer) => {
            const idsInLayer = layers[layer];
            const count = idsInLayer.length;
            const totalWidth = (count - 1) * spacingX;
            const startX = origin.x - totalWidth / 2;

            idsInLayer.forEach((id, indexInLayer) => {
                const block = idToBlock[id];
                const position = {
                    x: startX + indexInLayer * spacingX,
                    y: origin.y + layer * spacingY,
                };
                nodes.push(createNodeFromBlock(block, position));
            });
        });

    return nodes;
}

export function templateEdgesToEdges(templateEdges) {
    if (!Array.isArray(templateEdges)) return [];

    return templateEdges.map(([source, target]) => ({
        id: `e-${source}-${target}`,
        source: String(source),
        target: String(target),
        type: "bezier",
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
        },
    }));
}

export function VPLNodesToFlowBlocks(nodes) {
    if (!Array.isArray(nodes)) return [];

    return nodes.map((node) => {
        const { id, type: vplType, position, description, payload } = node;
        return {
            id: id,
            type: vplToFlowType(vplType),
            position: position || { x: 0, y: 0 },
            data: { id, vplType, description, payload },
        };
    });
}

export function verifyProgram(nodes, edges) {
    if (!Array.isArray(nodes)) return false;
    if (!Array.isArray(edges)) return false;
    if (nodes.length === 0) return false;
    if (edges.length === 0) return false;

    // Map node ids (can be strings) to set of neighbors
    const nodeIds = nodes.map((node) => String(node.id));
    const edgeMap = {};
    nodeIds.forEach((id) => {
        edgeMap[id] = [];
    });
    edges.forEach((edge) => {
        if (edgeMap[edge.source]) {
            edgeMap[edge.source].push(edge.target);
        }
    });

    // Cycle detection using DFS with visited and recursion stack
    const visited = {};
    const recStack = {};

    function hasCycle(nodeId) {
        if (!visited[nodeId]) {
            visited[nodeId] = true;
            recStack[nodeId] = true;

            for (const neighbor of edgeMap[nodeId]) {
                if (!visited[neighbor] && hasCycle(neighbor)) {
                    return true;
                } else if (recStack[neighbor]) {
                    return true;
                }
            }
        }
        recStack[nodeId] = false;
        return false;
    }

    for (const nodeId of nodeIds) {
        if (hasCycle(nodeId)) return false;
    }
    return true;
}

// export function exportProgram(program) {
//     // serialise program and send request
// }
