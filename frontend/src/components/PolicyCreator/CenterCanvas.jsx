function CenterCanvas({
    canvasRef,
    nodeRefs,
    canvasBlocks,
    setCanvasBlocks,
    edges,
    setEdges,
    selectedBlock,
    setSelectedBlock,
    connectingFrom,
    setConnectingFrom,
    draggingEdge,
    setDraggingEdge,
    editingLabelId,
    editingLabelValue,
    setEditingLabelValue,
    onBlockPointerDown,
    getAnchorPosition,
    addEdge,
    handleAnchorClick,
    startEdgeDrag,
    startEditingLabel,
    commitLabelEdit,
}) {
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
        overflow: "auto",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    };

    const emptyStateStyle = {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        color: "#999999",
        textAlign: "center",
        fontStyle: "italic",
    };

    const nodeStyle = (block) => ({
        position: "absolute",
        left: `${block.x}px`,
        top: `${block.y}px`,
        width: "140px",
        backgroundColor: selectedBlock?.id === block.id ? "#1a4d2e" : "#ffffff",
        border:
            selectedBlock?.id === block.id
                ? "2px solid #1a4d2e"
                : "2px solid #d0d0d0",
        borderRadius: "0.5rem",
        padding: "0.75rem",
        cursor: "grab",
        textAlign: "center",
        transition: "all 0.2s",
        boxShadow:
            selectedBlock?.id === block.id
                ? "0 4px 12px rgba(26, 77, 46, 0.3)"
                : "0 1px 3px rgba(0, 0, 0, 0.1)",
        zIndex:
            block.type === "input"
                ? 100
                : block.type === "decider"
                  ? 200
                  : block.type === "const"
                    ? 300
                    : 400,
    });

    const typeStyle = (isSelected) => ({
        fontSize: "0.625rem",
        fontWeight: "700",
        color: isSelected ? "#ffffff" : "#999999",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        margin: "0 0 0.5rem 0",
    });

    const labelStyle = (isSelected) => ({
        fontSize: "0.875rem",
        fontWeight: "600",
        color: isSelected ? "#ffffff" : "#000000",
        margin: "0 0 0.5rem 0",
        wordBreak: "break-word",
        cursor: "text",
    });

    const labelInputStyle = {
        width: "100%",
        fontSize: "0.875rem",
        fontWeight: "600",
        padding: "0.25rem",
        border: "1px solid #d0d0d0",
        borderRadius: "0.25rem",
        boxSizing: "border-box",
        fontFamily: "inherit",
    };

    const buttonStyle = {
        width: "28px",
        height: "28px",
        padding: 0,
        backgroundColor: "#1a4d2e",
        color: "#ffffff",
        border: "none",
        borderRadius: "50%",
        fontSize: "1.125rem",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "background-color 0.2s",
        margin: "0 auto",
        display: "block",
    };

    const anchorStyle = (isConnecting) => ({
        position: "absolute",
        width: "12px",
        height: "12px",
        backgroundColor: isConnecting ? "#1a4d2e" : "#ffffff",
        border: isConnecting ? "2px solid #1a4d2e" : "2px solid #d0d0d0",
        borderRadius: "50%",
        cursor: "pointer",
        transition: "all 0.2s",
    });

    const handleButtonHover = (e) => {
        e.target.style.backgroundColor = "#0f3620";
    };

    const handleButtonLeave = (e) => {
        e.target.style.backgroundColor = "#1a4d2e";
    };

    const handleNodeHover = (e, isSelected) => {
        if (!isSelected) {
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
            e.currentTarget.style.borderColor = "#1a4d2e";
        }
    };

    const handleNodeLeave = (e, isSelected) => {
        if (!isSelected) {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
            e.currentTarget.style.borderColor = "#d0d0d0";
        }
    };

    return (
        <main style={mainStyle}>
            <div
                ref={canvasRef}
                style={canvasStyle}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const type = e.dataTransfer.getData(
                        "application/vpl-block",
                    );
                    const label = e.dataTransfer.getData(
                        "application/vpl-label",
                    );
                    if (!type || !canvasRef.current) return;

                    const rect = canvasRef.current.getBoundingClientRect();
                    const x = Math.max(20, e.clientX - rect.left - 60);
                    const y = Math.max(20, e.clientY - rect.top - 24);
                    const id = `blk-${Date.now()}`;

                    const newBlock = {
                        id,
                        type,
                        label: label || type,
                        x,
                        y,
                        ticket: { recipient: "", action: "", description: "" },
                    };

                    setCanvasBlocks((prev) => [...prev, newBlock]);
                    setSelectedBlock(newBlock);
                }}
            >
                {/* SVG layer for edges */}
                <svg
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        overflow: "visible",
                        pointerEvents: "none",
                    }}
                >
                    {edges.map((edge) => {
                        const a = getAnchorPosition(
                            edge.from,
                            "right",
                            edge.outPort || null,
                        );
                        const b = getAnchorPosition(
                            edge.to,
                            "left",
                            edge.inPort || null,
                        );
                        if (!a || !b) return null;

                        const dx = Math.max(40, Math.abs(b.x - a.x) / 2);
                        const d = `M ${a.x} ${a.y} C ${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;

                        return (
                            <g key={edge.id}>
                                <path
                                    d={d}
                                    stroke="#1a4d2e"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                                <circle
                                    cx={b.x}
                                    cy={b.y}
                                    r="4"
                                    fill="#1a4d2e"
                                />
                                {edge.outPort && (
                                    <text
                                        x={(a.x + b.x) / 2}
                                        y={(a.y + b.y) / 2 - 6}
                                        fontSize="10"
                                        textAnchor="middle"
                                        fill="#1a4d2e"
                                    >
                                        {edge.outPort === "true" ? "T" : "F"}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Temporary dragging edge */}
                    {draggingEdge &&
                        (() => {
                            const a = getAnchorPosition(
                                draggingEdge.fromId,
                                draggingEdge.fromSide,
                                draggingEdge.fromPort || null,
                            );
                            if (!a || !canvasRef.current) return null;

                            const cRect =
                                canvasRef.current.getBoundingClientRect();
                            const bx = draggingEdge.x - cRect.left;
                            const by = draggingEdge.y - cRect.top;
                            const dx = Math.max(40, Math.abs(bx - a.x) / 2);
                            const d = `M ${a.x} ${a.y} C ${a.x + dx} ${a.y} ${bx - dx} ${by} ${bx} ${by}`;

                            return (
                                <g>
                                    <path
                                        d={d}
                                        stroke="#1a4d2e"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray="4 6"
                                    />
                                    <circle
                                        cx={bx}
                                        cy={by}
                                        r="4"
                                        fill="#1a4d2e"
                                    />
                                </g>
                            );
                        })()}
                </svg>

                {/* Canvas blocks */}
                {canvasBlocks.length > 0 ? (
                    canvasBlocks.map((block) => (
                        <div
                            key={block.id}
                            ref={(el) => {
                                if (el) nodeRefs.current[block.id] = el;
                            }}
                            style={nodeStyle(block)}
                            onPointerDown={(e) =>
                                onBlockPointerDown(e, block.id)
                            }
                            onClick={() => setSelectedBlock(block)}
                            onMouseEnter={(e) =>
                                handleNodeHover(
                                    e,
                                    selectedBlock?.id === block.id,
                                )
                            }
                            onMouseLeave={(e) =>
                                handleNodeLeave(
                                    e,
                                    selectedBlock?.id === block.id,
                                )
                            }
                        >
                            <div
                                style={typeStyle(
                                    selectedBlock?.id === block.id,
                                )}
                            >
                                {block.type}
                            </div>

                            {editingLabelId === block.id ? (
                                <input
                                    autoFocus
                                    style={labelInputStyle}
                                    value={editingLabelValue}
                                    onChange={(e) =>
                                        setEditingLabelValue(e.target.value)
                                    }
                                    onBlur={() => commitLabelEdit()}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                            commitLabelEdit();
                                    }}
                                />
                            ) : (
                                <div
                                    style={labelStyle(
                                        selectedBlock?.id === block.id,
                                    )}
                                    onDoubleClick={() =>
                                        startEditingLabel(block.id)
                                    }
                                >
                                    {block.label}
                                </div>
                            )}

                            <button
                                style={buttonStyle}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBlock(block);
                                }}
                                onMouseEnter={handleButtonHover}
                                onMouseLeave={handleButtonLeave}
                            >
                                +
                            </button>

                            {/* Anchors */}
                            <div
                                onPointerDown={(e) =>
                                    startEdgeDrag(e, block.id, "left", null)
                                }
                                onClick={(e) =>
                                    handleAnchorClick(e, block.id, "left", null)
                                }
                                style={{
                                    ...anchorStyle(false),
                                    left: "-6px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }}
                            />

                            {block.type === "decider" ? (
                                <>
                                    <div
                                        onPointerDown={(e) =>
                                            startEdgeDrag(
                                                e,
                                                block.id,
                                                "right",
                                                "true",
                                            )
                                        }
                                        onClick={(e) =>
                                            handleAnchorClick(
                                                e,
                                                block.id,
                                                "right",
                                                "true",
                                            )
                                        }
                                        style={{
                                            ...anchorStyle(
                                                connectingFrom?.id ===
                                                    block.id &&
                                                    connectingFrom?.port ===
                                                        "true",
                                            ),
                                            right: "-6px",
                                            top: "30%",
                                            transform: "translateY(-50%)",
                                        }}
                                    />
                                    <div
                                        onPointerDown={(e) =>
                                            startEdgeDrag(
                                                e,
                                                block.id,
                                                "right",
                                                "false",
                                            )
                                        }
                                        onClick={(e) =>
                                            handleAnchorClick(
                                                e,
                                                block.id,
                                                "right",
                                                "false",
                                            )
                                        }
                                        style={{
                                            ...anchorStyle(
                                                connectingFrom?.id ===
                                                    block.id &&
                                                    connectingFrom?.port ===
                                                        "false",
                                            ),
                                            right: "-6px",
                                            top: "70%",
                                            transform: "translateY(-50%)",
                                        }}
                                    />
                                </>
                            ) : (
                                <div
                                    onPointerDown={(e) =>
                                        startEdgeDrag(
                                            e,
                                            block.id,
                                            "right",
                                            null,
                                        )
                                    }
                                    onClick={(e) =>
                                        handleAnchorClick(
                                            e,
                                            block.id,
                                            "right",
                                            null,
                                        )
                                    }
                                    style={{
                                        ...anchorStyle(
                                            connectingFrom?.id === block.id,
                                        ),
                                        right: "-6px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                    }}
                                />
                            )}
                        </div>
                    ))
                ) : (
                    <div style={emptyStateStyle}>
                        <div>
                            Select a template or drag blocks from the library
                            below
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default CenterCanvas;
