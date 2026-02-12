<<<<<<< HEAD
import { useState } from "react";
=======
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./PolicyCreator.css";
>>>>>>> a85fcc6 (feat(ui): add navigation, pages, VPL prototype, and theme updates)

function PolicyCreator() {
    const [blocksPanelExpanded, setBlocksPanelExpanded] = useState(false);
    const location = useLocation();

    // sample templates with mock VPL blocks and ticket data
    const templates = [
        {
            id: "t-scale",
            title: "Scale when low usage",
            description: "Create ticket to scale down instances when usage < 20%",
            vplBlocks: [
                { id: "b-usage", type: "input", label: "Usage %", ticket: { recipient: "ops@example.com", action: "read usage", description: "Read current usage %" } },
                { id: "b-const", type: "const", label: "20", ticket: { recipient: "ops@example.com", action: "const value", description: "Threshold value" } },
                { id: "b-compare", type: "decider", label: "<", ticket: { recipient: "ops@example.com", action: "compare", description: "Compare usage with threshold" } },
                { id: "b-ticket", type: "output", label: "Create Ticket", ticket: { recipient: "ops@example.com", action: "Scale down instances", description: "Scale down due to low usage" } },
            ],
        },
        {
            id: "t-cost",
            title: "Notify on high cost",
            description: "Notify when daily cost > $200",
            vplBlocks: [
                { id: "b-cost", type: "input", label: "Daily Cost", ticket: { recipient: "finance@example.com", action: "read cost", description: "Read daily cost" } },
                { id: "b-cconst", type: "const", label: "200", ticket: { recipient: "finance@example.com", action: "const value", description: "Cost threshold" } },
                { id: "b-ccompare", type: "decider", label: ">", ticket: { recipient: "finance@example.com", action: "compare", description: "Compare cost with threshold" } },
                { id: "b-cticket", type: "output", label: "Notify Team", ticket: { recipient: "finance@example.com", action: "Notify on high cost", description: "Send notification to finance team" } },
            ],
        },
    ];

    const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
    const [selectedBlock, setSelectedBlock] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const policyId = params.get("policy");
        const isNew = params.get("new");
        if (isNew) {
            setSelectedTemplate(templates[0]);
            setSelectedBlock(null);
            return;
        }

        if (policyId) {
            // map policy id to a template and a block to open
            const map = {
                "p-1": { templateId: "t-scale", blockId: "b-ticket" },
                "p-2": { templateId: "t-cost", blockId: "b-cticket" },
            };
            const entry = map[policyId];
            if (entry) {
                const t = templates.find((x) => x.id === entry.templateId);
                setSelectedTemplate(t || templates[0]);
                const block = (t || templates[0]).vplBlocks.find((b) => b.id === entry.blockId);
                setSelectedBlock(block || null);
            }
        }
    }, [location.search]);

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header with Save Button */}
            <header className="flex justify-end items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
                <button className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors">
                    Save
                </button>
            </header>

            {/* Main Content Area */}
            <div className="flex gap-4 p-4 overflow-hidden flex-1">
                {/* Left Sidebar - Policies/Templates */}
                <aside className="w-72 bg-white border border-gray-200 rounded shadow-sm flex flex-col overflow-y-auto">
                    <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="m-0 text-sm font-bold text-gray-900">
                            Templates
                        </h3>
                    </div>
                    <div className="px-3 py-3 border-b border-gray-200">
                        <input
                            type="text"
                            placeholder="🔍 Search"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
<<<<<<< HEAD
                    <div className="flex-1 p-2 flex flex-col gap-1.5 overflow-y-auto">
                        <div className="px-3 py-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-all">
                            Template 1
                        </div>
                        <div className="px-3 py-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-all">
                            Template 2
                        </div>
                        <div className="px-3 py-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-all">
                            Template 5
                        </div>
=======
                    <div className="template-list">
                        {templates.map((t) => (
                            <div
                                key={t.id}
                                className={`template-item ${selectedTemplate && selectedTemplate.id === t.id ? "selected" : ""}`}
                                onClick={() => {
                                    setSelectedTemplate(t);
                                    setSelectedBlock(null);
                                }}
                            >
                                <div className="template-title">{t.title}</div>
                                <div className="template-desc">{t.description}</div>
                            </div>
                        ))}
>>>>>>> a85fcc6 (feat(ui): add navigation, pages, VPL prototype, and theme updates)
                    </div>
                </aside>

                {/* Center Canvas Area */}
<<<<<<< HEAD
                <main className="flex-1 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center overflow-hidden">
                    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400 text-lg">
                        <p>Flowchart Editor Canvas</p>
=======
                <main className="flowchart-canvas">
                    <div className="vpl-canvas">
                        {selectedTemplate && selectedTemplate.vplBlocks.map((b, i) => (
                            <div
                                key={b.id}
                                className={`vpl-node ${selectedBlock && selectedBlock.id === b.id ? "active" : ""}`}
                                style={{ left: 60 + i * 160 }}
                                onClick={() => setSelectedBlock(b)}
                            >
                                <div className="node-top">{b.type}</div>
                                <div className="node-label">{b.label}</div>
                                <button
                                    className="node-plus"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // open ticket editor for this block
                                        setSelectedBlock(b);
                                    }}
                                >
                                    +
                                </button>
                            </div>
                        ))}
>>>>>>> a85fcc6 (feat(ui): add navigation, pages, VPL prototype, and theme updates)
                    </div>
                </main>

                {/* Right Sidebar - Ticket Editor */}
                <aside className="ticket-editor">
                    <div className="ticket-header">
                        <h4>Ticket Editor</h4>
                    </div>

                    <div className="ticket-body">
                        <label>
                            Recipient
                            <input
                                type="text"
                                placeholder="Recipient"
                                value={selectedBlock ? selectedBlock.ticket.recipient : ""}
                                onChange={(e) => {
                                    if (!selectedBlock) return;
                                    setSelectedBlock({ ...selectedBlock, ticket: { ...selectedBlock.ticket, recipient: e.target.value } });
                                }}
                            />
                        </label>

                        <label>
                            Action
                            <input
                                type="text"
                                placeholder="Action"
                                value={selectedBlock ? selectedBlock.ticket.action : ""}
                                onChange={(e) => {
                                    if (!selectedBlock) return;
                                    setSelectedBlock({ ...selectedBlock, ticket: { ...selectedBlock.ticket, action: e.target.value } });
                                }}
                            />
                        </label>

                        <label className="description-label">
                            Description
                            <textarea
                                placeholder="Describe the ticket..."
                                value={selectedBlock ? selectedBlock.ticket.description : ""}
                                onChange={(e) => {
                                    if (!selectedBlock) return;
                                    setSelectedBlock({ ...selectedBlock, ticket: { ...selectedBlock.ticket, description: e.target.value } });
                                }}
                            />
                        </label>

                        <div className="ticket-actions">
                            <button className="save-btn" onClick={() => alert('Ticket saved (mock)')}>Save</button>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Bottom Panel - Flowchart Blocks Library */}
            <div
                className={`bg-white border-t border-gray-200 rounded-t shadow-sm transition-all duration-300 ${
                    blocksPanelExpanded ? "max-h-[40vh]" : "max-h-14"
                } ${blocksPanelExpanded ? "overflow-y-auto" : "overflow-hidden"}`}
            >
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <button
                        className="flex items-center gap-2 bg-none border-none cursor-pointer text-sm font-semibold text-gray-900 p-0 hover:text-emerald-600 transition-colors"
                        onClick={() =>
                            setBlocksPanelExpanded(!blocksPanelExpanded)
                        }
                    >
                        {blocksPanelExpanded ? "▼" : "▲"} Blocks Library
                    </button>
                </div>

                {blocksPanelExpanded && (
                    <div className="p-4 flex gap-8 overflow-x-auto">
                        <div className="flex-shrink-0">
                            <h4 className="m-0 mb-3 text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Inputs
                            </h4>
                            <div className="flex flex-col gap-2">
                                <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded text-sm text-gray-900 cursor-grab hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm transition-all active:cursor-grabbing">
                                    Input Block
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            <h4 className="m-0 mb-3 text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Components
                            </h4>
                            <div className="flex flex-col gap-2">
                                <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded text-sm text-gray-900 cursor-grab hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm transition-all active:cursor-grabbing">
                                    Process Block
                                </div>
                                <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded text-sm text-gray-900 cursor-grab hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm transition-all active:cursor-grabbing">
                                    Decision Block
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            <h4 className="m-0 mb-3 text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Outputs
                            </h4>
                            <div className="flex flex-col gap-2">
                                <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded text-sm text-gray-900 cursor-grab hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm transition-all active:cursor-grabbing">
                                    Output Block
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PolicyCreator;
