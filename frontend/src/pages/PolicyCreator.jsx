import { useState, useRef, useEffect } from "react";
import Header from "../components/PolicyCreator/Header";
import LeftSidebar from "../components/PolicyCreator/LeftSidebar";
import CenterCanvas from "../components/PolicyCreator/CenterCanvas";
import RightSidebar from "../components/PolicyCreator/RightSidebar";
import BottomLibrary from "../components/PolicyCreator/BottomLibrary";
import Templates from "../data/templates.json";

function PolicyCreator() {
    // UI State
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [blocksPanelExpanded, setBlocksPanelExpanded] = useState(false);

    // Flowchart State
    const [canvasBlocks, setCanvasBlocks] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [connectingFrom, setConnectingFrom] = useState(null);
    const [draggingEdge, setDraggingEdge] = useState(null);
    const [editingLabelId, setEditingLabelId] = useState(null);
    const [editingLabelValue, setEditingLabelValue] = useState("");

    // Refs
    const canvasRef = useRef(null);
    const nodeRefs = useRef({});

    // When template is selected, populate canvas blocks with positioned layout
    useEffect(() => {
        if (selectedTemplate) {
            const positionedBlocks = selectedTemplate.vplBlocks.map(
                (block, index) => ({
                    ...block,
                    x: 60 + index * 160,
                    y: 60,
                }),
            );
            setCanvasBlocks(positionedBlocks);
            setEdges([]);
            setSelectedBlock(null);
            setConnectingFrom(null);
            setEditingLabelId(null);
        } else {
            setCanvasBlocks([]);
            setEdges([]);
            setSelectedBlock(null);
            setConnectingFrom(null);
            setEditingLabelId(null);
        }
    }, [selectedTemplate]);

    // Handle template selection
    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
    };

    // Handle block update from properties panel
    const handleBlockUpdate = (updatedBlock) => {
        setSelectedBlock(updatedBlock);
        setCanvasBlocks((prev) =>
            prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)),
        );
    };

    // Get anchor position for a node
    const getAnchorPosition = (blockId, side, port) => {
        const nodeEl = nodeRefs.current[blockId];
        if (!nodeEl) return null;

        const nodeRect = nodeEl.getBoundingClientRect();
        const canvasRect = canvasRef.current.getBoundingClientRect();

        const x =
            nodeRect.left -
            canvasRect.left +
            (side === "left" ? 0 : nodeRect.width);
        const baseY = nodeRect.top - canvasRect.top + nodeRect.height / 2;

        if (side === "right" && port === "true") {
            return {
                x,
                y: nodeRect.top - canvasRect.top + nodeRect.height * 0.3,
            };
        } else if (side === "right" && port === "false") {
            return {
                x,
                y: nodeRect.top - canvasRect.top + nodeRect.height * 0.7,
            };
        }

        return { x, y: baseY };
    };

    // Start dragging an edge
    const startEdgeDrag = (e, fromId, side, port) => {
        e.preventDefault();
        setConnectingFrom({ id: fromId, side, port });
        setDraggingEdge({
            fromId,
            fromSide: side,
            fromPort: port,
            x: e.clientX,
            y: e.clientY,
        });

        const handleMouseMove = (moveEvent) => {
            setDraggingEdge((prev) => ({
                ...prev,
                x: moveEvent.clientX,
                y: moveEvent.clientY,
            }));
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            setDraggingEdge(null);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    // Handle anchor click to complete edge
    const handleAnchorClick = (e, toId, toSide, toPort) => {
        e.stopPropagation();
        if (!connectingFrom) return;

        // Prevent self-loops
        if (connectingFrom.id === toId) {
            setConnectingFrom(null);
            return;
        }

        // Only allow connections from left side to right side
        if (connectingFrom.side !== "right" || toSide !== "left") {
            setConnectingFrom(null);
            return;
        }

        addEdge(connectingFrom.id, toId, connectingFrom.port, toPort);
        setConnectingFrom(null);
    };

    // Add edge to state
    const addEdge = (fromId, toId, outPort, inPort) => {
        const newEdge = {
            id: `edge-${Date.now()}`,
            from: fromId,
            to: toId,
            outPort,
            inPort,
        };
        setEdges((prev) => [...prev, newEdge]);
    };

    // Block pointer down for dragging blocks
    const onBlockPointerDown = (e, blockId) => {
        const block = canvasBlocks.find((b) => b.id === blockId);
        if (!block) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startBlockX = block.x;
        const startBlockY = block.y;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            setCanvasBlocks((prev) =>
                prev.map((b) =>
                    b.id === blockId
                        ? {
                              ...b,
                              x: Math.max(0, startBlockX + deltaX),
                              y: Math.max(0, startBlockY + deltaY),
                          }
                        : b,
                ),
            );
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    // Start editing label
    const startEditingLabel = (blockId) => {
        const block = canvasBlocks.find((b) => b.id === blockId);
        if (block) {
            setEditingLabelId(blockId);
            setEditingLabelValue(block.label);
        }
    };

    // Commit label edit
    const commitLabelEdit = () => {
        if (editingLabelId) {
            setCanvasBlocks((prev) =>
                prev.map((b) =>
                    b.id === editingLabelId
                        ? { ...b, label: editingLabelValue }
                        : b,
                ),
            );
            if (selectedBlock && selectedBlock.id === editingLabelId) {
                setSelectedBlock({
                    ...selectedBlock,
                    label: editingLabelValue,
                });
            }
        }
        setEditingLabelId(null);
        setEditingLabelValue("");
    };

    const handleSave = async () => {
        if (!selectedTemplate) {
            alert("No policy selected to save.");
            return;
        }
        // Export policy as JSON using the new schema
        // Import transformVplToSchema from vplToJson.js
        try {
            const { transformVplToSchema } =
                await import("../components/PolicyCreator/vplToJson");
            const policyJson = transformVplToSchema(selectedTemplate);
            // Send to backend
            const response = await fetch("/api/policies", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(policyJson),
            });
            if (response.ok) {
                alert("Policy saved and sent to backend!");
            } else {
                alert("Failed to save policy: " + (await response.text()));
            }
        } catch (err) {
            alert("Error saving policy: " + err);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                backgroundColor: "#f5f5f5",
            }}
        >
            <Header onSave={handleSave} />

            <div
                style={{
                    display: "flex",
                    gap: "1rem",
                    padding: "1rem",
                    overflow: "hidden",
                    flex: 1,
                }}
            >
                <LeftSidebar
                    templates={Templates}
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={handleTemplateSelect}
                />

                <CenterCanvas
                    canvasRef={canvasRef}
                    nodeRefs={nodeRefs}
                    canvasBlocks={canvasBlocks}
                    setCanvasBlocks={setCanvasBlocks}
                    edges={edges}
                    selectedBlock={selectedBlock}
                    setSelectedBlock={setSelectedBlock}
                    setConnectingFrom={setConnectingFrom}
                    draggingEdge={draggingEdge}
                    editingLabelId={editingLabelId}
                    editingLabelValue={editingLabelValue}
                    setEditingLabelValue={setEditingLabelValue}
                    onBlockPointerDown={onBlockPointerDown}
                    getAnchorPosition={getAnchorPosition}
                    handleAnchorClick={handleAnchorClick}
                    startEdgeDrag={startEdgeDrag}
                    startEditingLabel={startEditingLabel}
                    commitLabelEdit={commitLabelEdit}
                />

                <RightSidebar
                    selectedBlock={selectedBlock}
                    onBlockUpdate={handleBlockUpdate}
                />
            </div>

            <BottomLibrary
                expanded={blocksPanelExpanded}
                onExpandToggle={() =>
                    setBlocksPanelExpanded(!blocksPanelExpanded)
                }
            />
        </div>
    );
}

export default PolicyCreator;
