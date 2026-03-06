import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { addEdge, applyEdgeChanges, applyNodeChanges, MarkerType } from "@xyflow/react";
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
    const VPL_id = useParams().id;

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

    // Load policy from API if an ID was given in the page parameters
    useEffect(() => {
        async function fetchPolicy() {
            const response = await fetch(`http://localhost:5000/api/policies/${VPL_id}`);
            if (!response.ok) {
                window.alert(`Policy ID ${VPL_id} could not be found`)
                return;
            }
            const policy = await response.json();
            setSelectedTemplate(policy);
        };
        fetchPolicy();
    },[])

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
        setEdges((eds) => {
            const next = applyEdgeChanges(changes, eds);
            const isOperations = (type) =>
                type === "add" ||
                type === "subtract" ||
                type === "multiply" ||
                type === "divide";

            return next.filter((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.source);
                const targetNode = nodes.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return true;

                const isBlueEdge = edge.style?.stroke === "#1976d2";
                const isRedEdge = edge.style?.stroke === "#d32f2f";

                if (isOperations(targetNode.data.type) && !isBlueEdge) {
                    return false;
                }
                if (targetNode.data.type === "output" && !isRedEdge) {
                    return false;
                }
                return true;
            });
        });
    };

    const handleConnect = (connection) => {
        // Prevent self-feeding loops (no edge from a node to itself)
        if (connection.source === connection.target) {
            return;
        }
        // Edge color logic (match template logic)
        const sourceNode = nodes.find((n) => n.id === connection.source);
        const targetNode = nodes.find((n) => n.id === connection.target);
        let edgeColor = '#888';
        function isInputsOrComponents(type) {
            return (
                type === 'input' ||
                type === 'const' ||
                type === 'number' ||
                type === 'op' ||
                type === 'component' ||
                type === 'add' ||
                type === 'subtract' ||
                type === 'multiply' ||
                type === 'divide'
            );
        }
        function isOperations(type) {
            return (
                type === 'add' ||
                type === 'subtract' ||
                type === 'multiply' ||
                type === 'divide'
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

        if (targetNode) {
            const targetType = targetNode.data.type;
            const isBlueEdge = edgeColor === '#1976d2';
            const isRedEdge = edgeColor === '#d32f2f';

            if (isOperations(targetType) && !isBlueEdge) {
                return;
            }
            if (targetType === 'output' && !isRedEdge) {
                return;
            }
        }
        setEdges((eds) => {
            // Only allow one edge per target/handle (input point)
            const filtered = eds.filter(
                (e) =>
                    !(e.target === connection.target &&
                      (!connection.targetHandle || e.targetHandle === connection.targetHandle))
            );
            return addEdge(
                {
                    ...connection,
                    type: 'default',
                    style: { stroke: edgeColor, strokeWidth: 4 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: edgeColor,
                    },
                },
                filtered
            );
        });
    };

    const handleDropBlock = (blockInfo, position) => {
        const block = {
            ...blockInfo,
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
                    const nextConstValue =
                        updatedNode.value !== undefined ? updatedNode.value : node.data.value;
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            value: nextConstValue,
                            label: updatedNode.label ?? node.data.label,
                            description: updatedNode.description ?? node.data.description,
                            payload: {
                                ...(node.data.payload || {}),
                                ...(updatedNode.payload || {}),
                                value: nextConstValue,
                            },
                        },
                    };
                }
                // For input blocks, update inputConfig
                if (node.data.type === "input") {
                    const nextInputConfig = updatedNode.inputConfig ?? node.data.inputConfig;
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            inputConfig: nextInputConfig,
                            description: updatedNode.description ?? node.data.description,
                            payload: nextInputConfig,
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
                      label: node.data.label,
                      value: node.data.value,
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

            let response = await doSave("http://localhost:5000/api/policies");
            if (!response.ok && response.status === 403) {
                response = await doSave("http://localhost:5000/api/policies");
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
