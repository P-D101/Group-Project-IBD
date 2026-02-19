import { useState } from "react";
import Header from "../components/PolicyCreator/Header";
import LeftSidebar from "../components/PolicyCreator/LeftSidebar";
import CenterCanvas from "../components/PolicyCreator/CenterCanvas";
import RightSidebar from "../components/PolicyCreator/RightSidebar";
import BottomLibrary from "../components/PolicyCreator/BottomLibrary";
import Templates from "../data/templates.json";

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
