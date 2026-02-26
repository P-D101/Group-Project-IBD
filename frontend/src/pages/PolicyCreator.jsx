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
        const initialEdges = templateEdgesToEdges(selectedTemplate.Connections);

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
            type: blockInfo.type,
            label: blockInfo.label,
        };
        const newNode = createNodeFromBlock(block, position);
        setNodes((prev) => [...prev, newNode]);
    };

    const handleNodeSelect = (nodeId) => {
        setSelectedNodeId(nodeId || null);
    };

    const handleBlockUpdate = (updatedNode) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== selectedNodeId) return node;
                return {
                    ...node,
                    ...updatedNode,
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
                      id: node.data.id,
                      type: node.data.type,
                      payload: node.data.payload,
                      description: node.data.description,
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
                type: node.data.vpLType,
                payload: node.data.payload,
            })),
            Connections: edges.map((edge) => [edge.source, edge.target]),
        };
        if (!verifyProgram(policyObject)) {
            alert("errors detected, couldn't save program.");
            return;
        }
        console.log(policyObject);
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
            <Header
                onSave={handleSave}
                policyName={policyName}
                setPolicyName={setPolicyName}
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
