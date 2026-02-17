import { useState } from "react";
import Header from "../components/PolicyCreator/Header";
import LeftSidebar from "../components/PolicyCreator/LeftSidebar";
import CenterCanvas from "../components/PolicyCreator/CenterCanvas";
import RightSidebar from "../components/PolicyCreator/RightSidebar";
import BottomLibrary from "../components/PolicyCreator/BottomLibrary";

const TEMPLATES = [
    {
        id: "t-scale",
        title: "Scale when low usage",
        description: "Create ticket to scale down instances when usage < 20%",
        vplBlocks: [
            {
                id: "b-usage",
                type: "input",
                label: "Usage %",
                ticket: {
                    recipient: "ops@example.com",
                    action: "read usage",
                    description: "Read current usage %",
                },
            },
            {
                id: "b-const",
                type: "const",
                label: "20",
                ticket: {
                    recipient: "ops@example.com",
                    action: "const value",
                    description: "Threshold value",
                },
            },
            {
                id: "b-compare",
                type: "decider",
                label: "<",
                ticket: {
                    recipient: "ops@example.com",
                    action: "compare",
                    description: "Compare usage with threshold",
                },
            },
            {
                id: "b-ticket",
                type: "output",
                label: "Create Ticket",
                ticket: {
                    recipient: "ops@example.com",
                    action: "Scale down instances",
                    description: "Scale down due to low usage",
                },
            },
        ],
    },
    {
        id: "t-cost",
        title: "Notify on high cost",
        description: "Notify when daily cost > $200",
        vplBlocks: [
            {
                id: "b-cost",
                type: "input",
                label: "Daily Cost",
                ticket: {
                    recipient: "finance@example.com",
                    action: "read cost",
                    description: "Read daily cost",
                },
            },
            {
                id: "b-cconst",
                type: "const",
                label: "200",
                ticket: {
                    recipient: "finance@example.com",
                    action: "const value",
                    description: "Cost threshold",
                },
            },
            {
                id: "b-ccompare",
                type: "decider",
                label: ">",
                ticket: {
                    recipient: "finance@example.com",
                    action: "compare",
                    description: "Compare cost with threshold",
                },
            },
            {
                id: "b-cticket",
                type: "output",
                label: "Notify Team",
                ticket: {
                    recipient: "finance@example.com",
                    action: "Notify on high cost",
                    description: "Send notification to finance team",
                },
            },
        ],
    },
];

function PolicyCreator() {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [blocksPanelExpanded, setBlocksPanelExpanded] = useState(false);

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setSelectedBlock(null);
    };

    const handleBlockSelect = (block) => {
        setSelectedBlock(block);
    };

    const handleBlockUpdate = (updatedBlock) => {
        setSelectedBlock(updatedBlock);
    };

    const handleSave = () => {
        // TODO: Implement save logic
        console.log("Saving policy...", { selectedTemplate, selectedBlock });
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
                    templates={TEMPLATES}
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={handleTemplateSelect}
                />

                <CenterCanvas
                    template={selectedTemplate}
                    selectedBlock={selectedBlock}
                    onBlockSelect={handleBlockSelect}
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
