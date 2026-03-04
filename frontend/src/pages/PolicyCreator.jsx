import { useEffect, useState } from "react";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import Header from "../components/PolicyCreator/Header";
import LeftSidebar from "../components/PolicyCreator/LeftSidebar";
import CenterCanvas from "../components/PolicyCreator/CenterCanvas";
import RightSidebar from "../components/PolicyCreator/RightSidebar";
import BottomLibrary from "../components/PolicyCreator/BottomLibrary";
import Templates from "../data/templates.json";
import {
    templateBlocksToNodes,
    createNodeFromBlock,
    verifyProgram,
    templateEdgesToEdges,
} from "../components/PolicyCreator/vplUtils";

function PolicyCreator() {
    const [saveError, setSaveError] = useState("");
    // UI State
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [bottomLibraryExpanded, setBottomLibraryExpanded] = useState(false);
    const [policyName, setPolicyName] = useState("");

    // Flowchart state
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    // Handle template selection
    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
    };

    // When template changes, pre-populate nodes from its vplBlocks
    useEffect(() => {
        if (!selectedTemplate || !selectedTemplate.Nodes) {
            return;
        }

        const initialNodes = templateBlocksToNodes(
            selectedTemplate.Nodes,
            selectedTemplate.Connections,
        );
        const initialEdges = templateEdgesToEdges(selectedTemplate.Connections, selectedTemplate.Nodes);

        // Defer state updates to avoid cascading synchronous renders inside the effect.
        queueMicrotask(() => {
            setNodes(initialNodes);
            setEdges(initialEdges);
            setSelectedNodeId(null);
        });
    }, [selectedTemplate]);

    const handleNodesChange = (changes) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
    };

    const handleEdgesChange = (changes) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
    };

    const handleConnect = (connection) => {
        // Prevent self-feeding loops (no edge from a node to itself)
        if (connection.source === connection.target) {
            return;
        }
        // Edge color logic (match template logic)
        const sourceNode = nodes.find((n) => n.id === connection.source);
        let edgeColor = '#888';
        function isInputsOrComponents(type) {
            return (
                type === 'input' ||
                type === 'const' ||
                type === 'number' ||
                type === 'op' ||
                type === 'component'
            );
        }
        function isDecisions(type) {
            return (
                type === 'lt' ||
                type === 'gt' ||
                type === 'eq' ||
                type === 'and' ||
                type === 'or' ||
                type === 'not' ||
                type === 'decision' ||
                type === 'greaterThan' ||
                type === 'lessThan' ||
                type === 'equal'
            );
        }
        if (sourceNode) {
            const t = sourceNode.data.type;
            if (isInputsOrComponents(t)) {
                edgeColor = '#1976d2';
            } else if (isDecisions(t)) {
                edgeColor = '#d32f2f';
            }
        }
        setEdges((eds) => {
            // Only allow one edge per target/handle (input point)
            const filtered = eds.filter(
                (e) =>
                    !(e.target === connection.target &&
                      (!connection.targetHandle || e.targetHandle === connection.targetHandle))
            );
            return addEdge({ ...connection, type: 'colored', style: { stroke: edgeColor, strokeWidth: 4 } }, filtered);
        });
    };

    const handleDropBlock = (blockInfo, position) => {
        const block = {
            type: blockInfo.type,
            label: blockInfo.label,
        };
        const newNode = createNodeFromBlock(block, position);
        setNodes((prev) => [...prev, newNode]);
    };

    const handleNodeSelect = (nodeId) => {
        setSelectedNodeId(nodeId || null);
        if (nodeId) {
            const node = nodes.find((n) => n.id === nodeId);
            console.log('Selected block:', node);
        }
    };

    const handleBlockUpdate = (updatedNode) => {
        console.log('Block update:', updatedNode);
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== selectedNodeId) return node;
                // For constant blocks, update value and label in node.data
                if (node.data.type === "const") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            value: updatedNode.value,
                            label: updatedNode.label,
                            description: updatedNode.description ?? node.data.description,
                            payload: updatedNode.payload ?? node.data.payload,
                        },
                    };
                }
                // For input blocks, update inputConfig
                if (node.data.type === "input") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            inputConfig: updatedNode.inputConfig ?? node.data.inputConfig,
                            description: updatedNode.description ?? node.data.description,
                            payload: updatedNode.payload ?? node.data.payload,
                        },
                    };
                }
                // For other blocks, update description and payload if present
                return {
                    ...node,
                    data: {
                        ...node.data,
                        description: updatedNode.description ?? node.data.description,
                        payload: updatedNode.payload ?? node.data.payload,
                    },
                };
            })
        );
    };

    const selectedBlock =
        selectedNodeId != null
            ? (() => {
                  const node = nodes.find((n) => n.id === selectedNodeId);
                  if (!node) return null;
                  return {
                      id: node.data.id,
                      type: node.data.type,
                      payload: node.data.payload,
                      description: node.data.description,
                      inputConfig: node.data.inputConfig,
                  };
              })()
            : null;

    const handleSave = async () => {
        const policyObject = {
            "Policy Name": policyName,
            "Data Sources": [],
            Nodes: nodes.map((node) => ({
                index: node.id,
                position: node.position,
                type: node.data.type,
                payload: node.data.payload,
            })),
            Connections: edges.map((edge) => [
                edge.source,
                edge.target,
                edge.targetHandle || "",
            ]),
        };

        if (!policyName || policyName.trim().length === 0) {
            window.alert("Error: Please name policy");
            return;
        }

        const inputTypes = new Set(["input", "const", "number"]);
        const outputTypes = new Set(["output", "ticket"]);
        const binaryTypes = new Set([
            "lt",
            "gt",
            "eq",
            "and",
            "or",
            "add",
            "subtract",
            "multiply",
            "divide",
        ]);

        const requiredHandlesByType = {
            lt: ["arg-0", "arg-1"],
            gt: ["arg-0", "arg-1"],
            eq: ["arg-0", "arg-1"],
            and: ["arg-0", "arg-1"],
            or: ["arg-0", "arg-1"],
            add: ["arg-0", "arg-1"],
            subtract: ["arg-0", "arg-1"],
            multiply: ["arg-0", "arg-1"],
            divide: ["arg-0", "arg-1"],
        };

        const incomingByNode = {};
        const outgoingByNode = {};
        const incomingByHandle = {};
        edges.forEach((edge) => {
            const targetHandle = edge.targetHandle || "__default__";
            const handleKey = `${edge.target}::${targetHandle}`;
            incomingByHandle[handleKey] = (incomingByHandle[handleKey] || 0) + 1;
            incomingByNode[edge.target] = (incomingByNode[edge.target] || 0) + 1;
            outgoingByNode[edge.source] = (outgoingByNode[edge.source] || 0) + 1;
        });

        let invalid = false;
        let invalidReason = "";
        nodes.forEach((node) => {
            const type = node.data.type;
            const nodeId = node.id;
            const incomingCount = incomingByNode[nodeId] || 0;
            const outgoingCount = outgoingByNode[nodeId] || 0;

            if (inputTypes.has(type)) {
                if (incomingCount !== 0 || outgoingCount !== 1) {
                    invalid = true;
                    invalidReason = `Input node ${nodeId} must have 0 incoming and 1 outgoing`;
                }
                return;
            }

            if (outputTypes.has(type)) {
                if (incomingCount !== 1 || outgoingCount !== 0) {
                    invalid = true;
                    invalidReason = `Output node ${nodeId} must have 1 incoming and 0 outgoing`;
                }
                return;
            }

            const requiredHandles = requiredHandlesByType[type];
            if (requiredHandles) {
                const handleCounts = requiredHandles.map((handleId) => {
                    const key = `${nodeId}::${handleId}`;
                    return incomingByHandle[key] || 0;
                });
                const hasAnyHandle = handleCounts.some((count) => count > 0);

                if (hasAnyHandle) {
                    handleCounts.forEach((count) => {
                        if (count !== 1) {
                            invalid = true;
                            invalidReason = `Node ${nodeId} handle missing link`;
                        }
                    });
                } else {
                    // Fallback when handles are missing: validate by total incoming count
                    if (incomingCount !== requiredHandles.length) {
                        invalid = true;
                        invalidReason = `Node ${nodeId} must have ${requiredHandles.length} incoming`;
                    }
                }

                if (outgoingCount !== 1) {
                    invalid = true;
                    invalidReason = `Node ${nodeId} must have 1 outgoing`;
                }
                return;
            }

            if (binaryTypes.has(type)) {
                if (incomingCount !== 2 || outgoingCount !== 1) {
                    invalid = true;
                    invalidReason = `Node ${nodeId} must have 2 incoming and 1 outgoing`;
                }
                return;
            }

            // For unknown node types, do not fail validation to avoid false negatives.
        });

        if (invalid) {
            console.warn("Policy invalid:", invalidReason || "Unknown reason", {
                nodes,
                edges,
            });
            window.alert(`Error: Invalid policy${invalidReason ? ` (${invalidReason})` : ""}`);
            return;
        }

        try {
            const doSave = async (url) => {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(policyObject),
                    mode: "cors",
                });
                return response;
            };

            let response = await doSave("/api/policies");
            if (!response.ok && response.status === 403) {
                response = await doSave("http://localhost:5001/api/policies");
            }

            if (!response.ok) {
                let details = "";
                try {
                    const contentType = response.headers.get("content-type") || "";
                    if (contentType.includes("application/json")) {
                        const json = await response.json();
                        details = json?.error || JSON.stringify(json);
                    } else {
                        details = await response.text();
                    }
                } catch (err) {
                    details = "";
                }
                const statusInfo = `HTTP ${response.status} ${response.statusText}`.trim();
                const extra = details || statusInfo;
                window.alert(
                    `Error: Unable to save policy${extra ? ` (${extra})` : ""}`
                );
                return;
            }

            window.alert("Policy saved succesfully");
        } catch (error) {
            window.alert(
                `Error: Unable to save policy${error?.message ? ` (${error.message})` : ""}`
            );
        }
    };

    const handleClearPolicy = () => {
        setNodes([]);
        setEdges([]);
        setSelectedNodeId(null);
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "90vh",
                backgroundColor: "#f5f5f5",
            }}
        >
            {saveError && (
                <div style={{ color: "#d32f2f", fontWeight: 600, padding: "0.5rem 1.5rem" }}>
                    {saveError}
                </div>
            )}
            <Header
                onSave={handleSave}
                policyName={policyName}
                setPolicyName={setPolicyName}
                onClear={handleClearPolicy}
            />

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
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={handleConnect}
                    onNodeSelect={handleNodeSelect}
                    onDropBlock={handleDropBlock}
                />

                <RightSidebar
                    selectedBlock={selectedBlock}
                    onBlockUpdate={handleBlockUpdate}
                />
            </div>

            <BottomLibrary
                expanded={bottomLibraryExpanded}
                onExpandToggle={() =>
                    setBottomLibraryExpanded(!bottomLibraryExpanded)
                }
            />
        </div>
    );
}

export default PolicyCreator;
