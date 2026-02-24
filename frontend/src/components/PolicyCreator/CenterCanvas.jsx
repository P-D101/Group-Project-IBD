import {
    ReactFlow,
    Background,
    Controls,
    ReactFlowProvider,
    useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

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

    const handleNodeClick = (_, node) => {
        if (onNodeSelect) {
            onNodeSelect(node.id);
        }
        console.log("node clicked", node);
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
                fitView
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
