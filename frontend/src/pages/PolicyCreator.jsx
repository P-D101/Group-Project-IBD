import { useState, useEffect } from "react";
import { useRef } from "react";
import { useLocation } from "react-router-dom";

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

    // canvas state: blocks placed on the flowchart canvas
    const [canvasBlocks, setCanvasBlocks] = useState(() =>
        (templates[0].vplBlocks || []).map((b, i) => ({ ...b, x: 40 + i * 160, y: 30 }))
    );

    const canvasRef = useRef(null);
    const draggingRef = useRef({ id: null, offsetX: 0, offsetY: 0 });
    const moveHandlerRef = useRef(null);
    const upHandlerRef = useRef(null);
    const nodeRefs = useRef({});
    const [edges, setEdges] = useState([]);
    const [connectingFrom, setConnectingFrom] = useState(null);
    const [editingLabelId, setEditingLabelId] = useState(null);
    const [editingLabelValue, setEditingLabelValue] = useState("");
    const [draggingEdge, setDraggingEdge] = useState(null); // { fromId, fromSide, fromPort, x, y }

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

    // sync canvas blocks when template changes
    useEffect(() => {
        const base = selectedTemplate?.vplBlocks || [];
        setCanvasBlocks(base.map((b, i) => ({ ...b, x: 40 + i * 160, y: 30 })));
        setSelectedBlock(null);
        // create simple sequential edges for template blocks (left->right)
        const sequential = base.map((b, i) => {
            if (i === 0) return null;
            return { id: `e-${i}-${Date.now()}`, from: base[i - 1].id, to: base[i].id };
        }).filter(Boolean);
        setEdges(sequential);
    }, [selectedTemplate]);

    function onBlockPointerDown(e, id) {
        e.stopPropagation();
        const rect = canvasRef.current && canvasRef.current.getBoundingClientRect();
        if (!rect) return;
        const b = canvasBlocks.find((bb) => bb.id === id);
        if (!b) return;
        const offsetX = e.clientX - rect.left - b.x;
        const offsetY = e.clientY - rect.top - b.y;
        draggingRef.current = { id, offsetX, offsetY };
        setSelectedBlock(b);

        // create handlers and store references so we can remove them later
        moveHandlerRef.current = function (ev) {
            const { id: dragId, offsetX: oX, offsetY: oY } = draggingRef.current;
            if (!dragId) return;
            const r = canvasRef.current.getBoundingClientRect();
            const x = Math.max(8, ev.clientX - r.left - oX);
            const y = Math.max(8, ev.clientY - r.top - oY);
            setCanvasBlocks((prev) => prev.map((bb) => (bb.id === dragId ? { ...bb, x, y } : bb)));
            setSelectedBlock((prev) => (prev && prev.id === dragId ? { ...prev, x, y } : prev));
        };

        upHandlerRef.current = function () {
            draggingRef.current = { id: null, offsetX: 0, offsetY: 0 };
            window.removeEventListener("pointermove", moveHandlerRef.current);
            window.removeEventListener("pointerup", upHandlerRef.current);
        };

        window.addEventListener("pointermove", moveHandlerRef.current);
        window.addEventListener("pointerup", upHandlerRef.current);
    }

    function getAnchorPosition(id, side = "right", port = null) {
        const node = nodeRefs.current[id];
        const canvas = canvasRef.current;
        if (!node || !canvas) return null;
        const nRect = node.getBoundingClientRect();
        const cRect = canvas.getBoundingClientRect();
        const x = side === "right" ? nRect.right - cRect.left : nRect.left - cRect.left;
        let yCenter = nRect.top + nRect.height / 2 - cRect.top;
        // if port specified for decider, offset above/below center
        if (port && port === 'true') {
            // slightly above center
            yCenter = nRect.top + nRect.height * 0.33 - cRect.top;
        } else if (port && port === 'false') {
            yCenter = nRect.top + nRect.height * 0.67 - cRect.top;
        }
        return { x, y: yCenter };
    }

    function addEdge({ fromId, toId, outPort = null, inPort = null }) {
        if (!fromId || !toId || fromId === toId) return;
        // avoid duplicate (same from,to and ports)
        setEdges((prev) => {
            if (prev.some((e) => e.from === fromId && e.to === toId && e.outPort === outPort && e.inPort === inPort)) return prev;
            return [...prev, { id: `e-${Date.now()}`, from: fromId, to: toId, outPort, inPort }];
        });
    }

    function handleAnchorClick(e, id, side, port = null) {
        e.stopPropagation();
        if (!connectingFrom) {
            // start connection from any anchor (store side/port)
            setConnectingFrom({ id, side, port });
            return;
        }
        // if already connecting, complete only if sides are opposite
        const from = connectingFrom;
        if (from.side !== side) {
            // determine actual fromId/toId depending on which side is output
            if (from.side === 'right' && side === 'left') {
                addEdge({ fromId: from.id, toId: id, outPort: from.port, inPort: port });
            } else if (from.side === 'left' && side === 'right') {
                addEdge({ fromId: id, toId: from.id, outPort: port, inPort: from.port });
            }
        }
        setConnectingFrom(null);
    }

    // Drag-to-create-edge handlers
    function startEdgeDrag(e, id, side, port = null) {
        e.preventDefault();
        e.stopPropagation();
        const move = (ev) => {
            setDraggingEdge((prev) => ({ ...(prev || { fromId: id, fromSide: side, fromPort: port }), x: ev.clientX, y: ev.clientY }));
        };

        const up = (ev) => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            // detect target anchor element
            const target = document.elementFromPoint(ev.clientX, ev.clientY);
            if (target) {
                const anchor = target.closest('.vpl-anchor');
                if (anchor) {
                    const toSide = anchor.dataset.side;
                    const toPort = anchor.dataset.port || null;
                    const toId = anchor.dataset.nodeid;
                    // only allow opposite sides
                    if (toId && toSide && toSide !== side) {
                        if (side === 'right' && toSide === 'left') {
                            addEdge({ fromId: id, toId, outPort: port, inPort: toPort });
                        } else if (side === 'left' && toSide === 'right') {
                            addEdge({ fromId: toId, toId: id, outPort: toPort, inPort: port });
                        }
                    }
                }
            }
            setDraggingEdge(null);
        };

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        // seed initial dragging state
        setDraggingEdge({ fromId: id, fromSide: side, fromPort: port, x: e.clientX, y: e.clientY });
    }

    function updateSelectedTicket(field, value) {
        if (!selectedBlock) return;
        const updated = { ...selectedBlock, ticket: { ...selectedBlock.ticket, [field]: value } };
        setSelectedBlock(updated);
        setCanvasBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    }

    function startEditingLabel(id) {
        const b = canvasBlocks.find((bb) => bb.id === id);
        if (!b) return;
        setEditingLabelId(id);
        setEditingLabelValue(b.label || "");
    }

    function commitLabelEdit() {
        if (!editingLabelId) return;
        const id = editingLabelId;
        setCanvasBlocks((prev) => prev.map((bb) => (bb.id === id ? { ...bb, label: editingLabelValue } : bb)));
        if (selectedBlock && selectedBlock.id === id) {
            setSelectedBlock({ ...selectedBlock, label: editingLabelValue });
        }
        setEditingLabelId(null);
        setEditingLabelValue("");
    }

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
                    </div>
                </aside>

                {/* Center Canvas Area */}
                {/* Center Canvas Area (interactive VPL) */}
                <main className="flowchart-canvas relative" style={{flex:1}}>
                    <div
                        ref={canvasRef}
                        className="vpl-canvas relative bg-transparent h-full"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const type = e.dataTransfer.getData("application/vpl-block");
                            const label = e.dataTransfer.getData("application/vpl-label");
                            if (!type) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = Math.max(20, e.clientX - rect.left - 60);
                            const y = Math.max(20, e.clientY - rect.top - 24);
                            const id = `blk-${Date.now()}`;
                            const newBlock = { id, type, label: label || type, x, y, ticket: { recipient: "", action: "", description: "" } };
                            setCanvasBlocks((s) => [...s, newBlock]);
                            setSelectedBlock(newBlock);
                        }}
                        style={{ minHeight: 300 }}
                    >
                        {/* SVG layer for edges (under nodes) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                            {edges.map((edge) => {
                                const a = getAnchorPosition(edge.from, 'right', edge.outPort || null);
                                const b = getAnchorPosition(edge.to, 'left', edge.inPort || null);
                                if (!a || !b) return null;
                                const dx = Math.max(40, Math.abs(b.x - a.x) / 2);
                                const d = `M ${a.x} ${a.y} C ${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;
                                return (
                                    <g key={edge.id}>
                                        <path d={d} stroke="#0f766e" strokeWidth={2} fill="none" strokeLinecap="round" />
                                        <circle cx={b.x} cy={b.y} r={4} fill="#0f766e" />
                                        {edge.outPort && (
                                            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 6} fontSize={10} textAnchor="middle" fill="#064e3b">{edge.outPort === 'true' ? 'T' : 'F'}</text>
                                        )}
                                    </g>
                                );
                            })}

                            {/* temporary dragging edge */}
                            {draggingEdge && (() => {
                                const a = getAnchorPosition(draggingEdge.fromId, draggingEdge.fromSide, draggingEdge.fromPort || null);
                                if (!a) return null;
                                // convert client coords to canvas local coords
                                const cRect = canvasRef.current.getBoundingClientRect();
                                const bx = draggingEdge.x - cRect.left;
                                const by = draggingEdge.y - cRect.top;
                                const dx = Math.max(40, Math.abs(bx - a.x) / 2);
                                const d = `M ${a.x} ${a.y} C ${a.x + dx} ${a.y} ${bx - dx} ${by} ${bx} ${by}`;
                                return (
                                    <g>
                                        <path d={d} stroke="#0f766e" strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray="4 6" />
                                        <circle cx={bx} cy={by} r={4} fill="#0f766e" />
                                    </g>
                                );
                            })()}
                        </svg>
                        {/* Render draggable blocks placed on canvas */}
                        {canvasBlocks.map((b) => (
                            <div
                                key={b.id}
                                ref={(el) => (nodeRefs.current[b.id] = el)}
                                onPointerDown={(e) => onBlockPointerDown(e, b.id)}
                                onClick={() => setSelectedBlock(b)}
                                className={`vpl-node absolute p-3 rounded shadow-sm bg-white border border-gray-200 cursor-grab ${selectedBlock && selectedBlock.id === b.id ? "ring-2 ring-emerald-300" : ""}`}
                                style={{ left: b.x, top: b.y, width: 140, zIndex: (b.type === 'input' ? 100 : b.type === 'decider' ? 200 : b.type === 'const' ? 300 : 400) }}
                            >
                                <div className="node-top font-medium text-xs text-gray-600">{b.type}</div>
                                {editingLabelId === b.id ? (
                                    <input
                                        autoFocus
                                        className="node-label-input w-full text-sm font-semibold border border-gray-300 rounded px-1 py-0.5"
                                        value={editingLabelValue}
                                        onChange={(e) => setEditingLabelValue(e.target.value)}
                                        onBlur={() => commitLabelEdit()}
                                        onKeyDown={(e) => { if (e.key === 'Enter') commitLabelEdit(); }}
                                    />
                                ) : (
                                    <div onDoubleClick={() => startEditingLabel(b.id)} className="node-label text-sm font-semibold">{b.label}</div>
                                )}

                                {/* anchors */}
                                <div
                                    onPointerDown={(e) => startEdgeDrag(e, b.id, 'left', null)}
                                    onClick={(e) => handleAnchorClick(e, b.id, 'left', null)}
                                    data-nodeid={b.id}
                                    data-side="left"
                                    data-port=""
                                    className="vpl-anchor absolute left-[-8px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-gray-300 rounded-full"
                                    style={{ cursor: 'pointer' }}
                                />

                                {b.type === 'decider' ? (
                                    // two right anchors for decider: true (top) and false (bottom)
                                    <>
                                        <div
                                            onPointerDown={(e) => startEdgeDrag(e, b.id, 'right', 'true')}
                                            onClick={(e) => handleAnchorClick(e, b.id, 'right', 'true')}
                                            data-nodeid={b.id}
                                            data-side="right"
                                            data-port="true"
                                            className={`vpl-anchor absolute right-[-8px] top-[30%] w-3 h-3 rounded-full ${connectingFrom && connectingFrom.id === b.id && connectingFrom.port === 'true' ? 'bg-emerald-500 border-emerald-700' : 'bg-white border border-gray-300'}`}
                                            style={{ cursor: 'pointer', transform: 'translateY(-50%)' }}
                                        />
                                        <div
                                            onPointerDown={(e) => startEdgeDrag(e, b.id, 'right', 'false')}
                                            onClick={(e) => handleAnchorClick(e, b.id, 'right', 'false')}
                                            data-nodeid={b.id}
                                            data-side="right"
                                            data-port="false"
                                            className={`vpl-anchor absolute right-[-8px] top-[70%] w-3 h-3 rounded-full ${connectingFrom && connectingFrom.id === b.id && connectingFrom.port === 'false' ? 'bg-emerald-500 border-emerald-700' : 'bg-white border border-gray-300'}`}
                                            style={{ cursor: 'pointer', transform: 'translateY(-50%)' }}
                                        />
                                    </>
                                ) : (
                                    <div
                                        onPointerDown={(e) => startEdgeDrag(e, b.id, 'right', null)}
                                        onClick={(e) => handleAnchorClick(e, b.id, 'right', null)}
                                        data-nodeid={b.id}
                                        data-side="right"
                                        data-port=""
                                        className={`vpl-anchor absolute right-[-8px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${connectingFrom && connectingFrom.id === b.id ? 'bg-emerald-500 border-emerald-700' : 'bg-white border border-gray-300'}`}
                                        style={{ cursor: 'pointer' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </main>

                {/* Right Sidebar - Output / Preview (non-editable) */}
                <aside className="w-80 bg-white border border-gray-200 rounded shadow-sm p-4 flex-shrink-0 overflow-y-auto">
                    <h4 className="m-0 mb-3 text-sm font-semibold">Output Preview</h4>
                    {selectedBlock ? (
                        <div className="mb-4">
                            <div className="text-xs text-gray-600">Selected Block</div>
                            <div className="mt-2 text-sm font-medium">{selectedBlock.label}</div>
                            <div className="mt-3 text-xs text-gray-600">Ticket</div>
                            <div className="mt-1 text-sm text-gray-800">Recipient: {selectedBlock.ticket.recipient || "—"}</div>
                            <div className="text-sm text-gray-800">Action: {selectedBlock.ticket.action || "—"}</div>
                            <div className="text-sm text-gray-800">Description: {selectedBlock.ticket.description || "—"}</div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600 mb-3">Select a block to see its output ticket here.</div>
                    )}

                    <div className="border-t border-gray-100 pt-3">
                        <div className="text-xs text-gray-600 mb-2">All Output Blocks</div>
                        {canvasBlocks.filter((b) => b.type === 'output').length === 0 && (
                            <div className="text-sm text-gray-500">No output blocks on canvas</div>
                        )}
                        {canvasBlocks.filter((b) => b.type === 'output').map((b) => (
                            <div key={b.id} className="mb-3 p-2 bg-gray-50 rounded border border-gray-100">
                                <div className="font-medium text-sm">{b.label}</div>
                                <div className="text-xs text-gray-600">Recipient: {b.ticket.recipient || '—'}</div>
                                <div className="text-xs text-gray-600">Action: {b.ticket.action || '—'}</div>
                            </div>
                        ))}
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
                        {/* Order: Input -> Decider -> Constant -> Output */}
                        <div className="flex-shrink-0">
                            <h4 className="m-0 mb-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Inputs</h4>
                            <div className="flex flex-col gap-2">
                                <div
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData("application/vpl-block", "input");
                                        e.dataTransfer.setData("application/vpl-label", "Input Block");
                                        e.dataTransfer.effectAllowed = "copy";
                                    }}
                                    className="px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded text-sm text-gray-900 cursor-grab hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm transition-all active:cursor-grabbing"
                                >
                                    Input Block
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            <h4 className="m-0 mb-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Deciders</h4>
                            <div className="flex flex-col gap-2">
                                <div
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData("application/vpl-block", "decider");
                                        e.dataTransfer.setData("application/vpl-label", "Decision Block");
                                        e.dataTransfer.effectAllowed = "copy";
                                    }}
                                    className="px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded text-sm text-gray-900 cursor-grab hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm transition-all active:cursor-grabbing"
                                >
                                    Decision Block
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            <h4 className="m-0 mb-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Constants</h4>
                            <div className="flex flex-col gap-2">
                                <div
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData("application/vpl-block", "const");
                                        e.dataTransfer.setData("application/vpl-label", "Constant");
                                        e.dataTransfer.effectAllowed = "copy";
                                    }}
                                    className="px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded text-sm text-gray-900 cursor-grab hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm transition-all active:cursor-grabbing"
                                >
                                    Constant
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            <h4 className="m-0 mb-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Outputs</h4>
                            <div className="flex flex-col gap-2">
                                <div
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData("application/vpl-block", "output");
                                        e.dataTransfer.setData("application/vpl-label", "Output Block");
                                        e.dataTransfer.effectAllowed = "copy";
                                    }}
                                    className="px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded text-sm text-gray-900 cursor-grab hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm transition-all active:cursor-grabbing"
                                >
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
