    import {
        ReactFlow,
        Background,
        Controls,
        ReactFlowProvider,
        useReactFlow,
    } from "@xyflow/react";
    import "@xyflow/react/dist/style.css";
    import BinaryOperator from "../nodes/BinaryOperator";
    import { BaseEdge } from "@xyflow/react";


    import React from "react";
    import { getBezierPath } from "@xyflow/react";
    function ColoredEdge({ id, sourceX, sourceY, targetX, targetY, style, data }) {
        try {
            const [edgePath] = getBezierPath({ sourceX, sourceY, targetX, targetY });
            // Robust color extraction
            let stroke = '#888';
            let strokeWidth = 2;
            if (data && typeof data === 'object' && data.style) {
                if (data.style.stroke) stroke = data.style.stroke;
                else if (data.style.color) stroke = data.style.color;
                if (data.style.strokeWidth) strokeWidth = data.style.strokeWidth;
            } else if (style && typeof style === 'object') {
                if (style.stroke) stroke = style.stroke;
                else if (style.color) stroke = style.color;
                if (style.strokeWidth) strokeWidth = style.strokeWidth;
            }
            // Debug: log style and data
            if (typeof window !== 'undefined') {
                console.log('Edge style:', style, 'Edge data:', data);
            }
            // Arrowhead SVG: simple triangle at end of edge
            const arrowSize = 12;
            // Calculate direction
            const dx = Number(targetX) - Number(sourceX);
        const dy = Number(targetY) - Number(sourceY);
            const len = Math.sqrt(dx * dx + dy * dy);
            if (!isFinite(dx) || !isFinite(dy) || !isFinite(len) || len < 1) {
                // If edge is too short or coordinates are invalid, skip arrowhead
                return (
                    <g>
                        <path
                            id={id}
                            d={edgePath}
                            fill="none"
                            stroke={stroke}
                            strokeWidth={strokeWidth}
                        />
                    </g>
                );
            }
            const normX = dx / len;
            const normY = dy / len;
            // Arrow tip
            const tipX = Number(targetX);
            const tipY = Number(targetY);
            // Base of arrow
            const baseX = tipX - normX * arrowSize;
            const baseY = tipY - normY * arrowSize;
            // Perpendicular for arrow width
            const perpX = -normY;
            const perpY = normX;
            const leftX = baseX + perpX * (arrowSize / 2);
            const leftY = baseY + perpY * (arrowSize / 2);
            const rightX = baseX - perpX * (arrowSize / 2);
            const rightY = baseY - perpY * (arrowSize / 2);
            if ([tipX, tipY, leftX, leftY, rightX, rightY].some((v) => !isFinite(v))) {
                // If any coordinate is invalid, skip arrowhead
                return (
                    <g>
                        <path
                            id={id}
                            d={edgePath}
                            fill="none"
                            stroke={stroke}
                            strokeWidth={strokeWidth}
                        />
                    </g>
                );
            }
            return (
                <g>
                    <path
                        id={id}
                        d={edgePath}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                    />
                    <polygon
                        points={`
                            ${tipX},${tipY}
                            ${leftX},${leftY}
                            ${rightX},${rightY}
                        `}
                        fill={stroke}
                    />
                </g>
            );
        } catch (err) {
            // Fallback: render a simple bezier if anything goes wrong
            console.error('ColoredEdge render error:', err);
            const [edgePath] = getBezierPath({ sourceX, sourceY, targetX, targetY });
            return (
                <g>
                    <path id={id} d={edgePath} fill="none" stroke="#888" strokeWidth={2} />
                </g>
            );
        }
    }

    function FlowWrapper({
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onNodeSelect,
        onDropBlock,
    }) {
        const reactFlowInstance = useReactFlow();
        const nodeTypes = { binaryOperator: BinaryOperator };
        const edgeTypes = { colored: ColoredEdge };

    const handleNodeClick = (_, node) => {
        if (onNodeSelect) {
            onNodeSelect(node.id);
        }
    };

    const handleSelectionChange = ({ nodes: selectedNodes }) => {
        if (!onNodeSelect) return;
        if (!selectedNodes || selectedNodes.length === 0) {
            onNodeSelect(null);
            return;
        }
        onNodeSelect(selectedNodes[0].id);
    };

    const handleDrop = (event) => {
        event.preventDefault();

        if (!onDropBlock || !reactFlowInstance) return;

        const blockType = event.dataTransfer?.getData("application/vpl-block");
        const label = event.dataTransfer?.getData("application/vpl-label");

        if (!blockType || !label) {
            return;
        }

        // Convert screen coordinates to flow coordinates
        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        onDropBlock(
            {
                type: blockType,
                label,
            },
            position,
        );
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        if (event.dataTransfer) {
            console.log("dropEffect", event.dataTransfer.dropEffect);
            event.dataTransfer.dropEffect = "copy";
        }
    };

    // ...existing code...
    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                onSelectionChange={handleSelectionChange}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                edgesUpdatable={true}
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}

function CenterCanvas(props) {
    const mainStyle = {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
    };

    const canvasStyle = {
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#ffffff",
        border: "1px solid #d0d0d0",
        borderRadius: "0.375rem",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    };

    return (
        <main style={mainStyle}>
            <div style={canvasStyle}>
                <ReactFlowProvider>
                    <FlowWrapper {...props} />
                </ReactFlowProvider>
            </div>
        </main>
    );
}

export default CenterCanvas;
