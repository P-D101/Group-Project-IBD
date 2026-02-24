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
} from "../components/PolicyCreator/vplUtils";

function PolicyCreator() {
    // UI State
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [bottomLibraryExpanded, setBottomLibraryExpanded] = useState(false);

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
        if (!selectedTemplate || !selectedTemplate.vplBlocks) {
            return;
        }

        const initialNodes = templateBlocksToNodes(selectedTemplate.vplBlocks, {
            x: 0,
            y: 0,
        });

        const initialEdges = initialNodes.slice(0, -1).map((node, index) => ({
            id: `e-${node.id}-${initialNodes[index + 1].id}`,
            source: node.id,
            target: initialNodes[index + 1].id,
            type: "smoothstep",
        }));

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
        setEdges((eds) => addEdge(connection, eds));
    };

    const handleDropBlock = (blockInfo, position) => {
        const block = {
            id: blockInfo.id || `${blockInfo.type}-${Date.now()}`,
            type: blockInfo.type,
            label: blockInfo.label,
        };
        const newNode = createNodeFromBlock(block, position);
        setNodes((prev) => [...prev, newNode]);
    };

    const handleNodeSelect = (nodeId) => {
        setSelectedNodeId(nodeId || null);
    };

    const handleBlockUpdate = (updatedBlock) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== selectedNodeId) return node;
                return {
                    ...node,
                    data: {
                        ...node.data,
                        ticket: {
                            ...node.data.ticket,
                            ...updatedBlock.ticket,
                        },
                    },
                };
            }),
        );
    };

    const selectedBlock =
        selectedNodeId != null
            ? (() => {
                  const node = nodes.find((n) => n.id === selectedNodeId);
                  if (!node) return null;
                  return {
                      id: node.data.blockId,
                      type: node.data.type,
                      label: node.data.label,
                      value: node.data.value,
                      ticket: node.data.ticket,
                  };
              })()
            : null;

    const handleSave = async () => {
        if (!verifyProgram(nodes, edges)) {
            alert("errors detected, couldn't save program.");
            return;
        }
        const policyObject = {
            "Policy Name": "Example",
            "Data Sources": [],
            Nodes: nodes.map((node) => ({
                Index: node.id,
                Type: node.data.type,
                Position: node.position,
            })),
            Connections: edges.map((edge) => [edge.source, edge.target]),
        };
        console.log(policyObject);
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
