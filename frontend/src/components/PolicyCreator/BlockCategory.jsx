function BlockCategory({ title, blocks }) {
    const containerStyle = {
        flex: "0 0 auto",
    };

    const titleStyle = {
        margin: 0,
        marginBottom: "0.75rem",
        fontSize: "0.75rem",
        fontWeight: "700",
        color: "#666666",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    };

    const blocksContainerStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
    };

    const blockItemStyle = {
        padding: "0.625rem 0.875rem",
        backgroundColor: "#f5f5f5",
        border: "1px solid #d0d0d0",
        borderRadius: "0.25rem",
        fontSize: "0.875rem",
        color: "#000000",
        fontWeight: "500",
        cursor: "grab",
        transition: "all 0.2s",
        userSelect: "none",
    };

    const handleMouseEnter = (e) => {
        e.target.style.backgroundColor = "#e8e8e8";
        e.target.style.borderColor = "#1a4d2e";
        e.target.style.boxShadow = "0 1px 3px rgba(26, 77, 46, 0.1)";
    };

    const handleMouseLeave = (e) => {
        e.target.style.backgroundColor = "#f5f5f5";
        e.target.style.borderColor = "#d0d0d0";
        e.target.style.boxShadow = "none";
    };

    const handleDragStart = (e, block) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("application/vpl-block", block.type || "");
        e.dataTransfer.setData("application/vpl-label", block.label);
        e.target.style.cursor = "grabbing";
    };

    const handleDragEnd = (e) => {
        e.target.style.cursor = "grab";
    };

    return (
        <div style={containerStyle}>
            <h4 style={titleStyle}>{title}</h4>
            <div style={blocksContainerStyle}>
                {blocks.map((block) => (
                    <div
                        key={block.id}
                        style={blockItemStyle}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        draggable
                        onDragStart={(e) => handleDragStart(e, block)}
                        onDragEnd={handleDragEnd}
                    >
                        {block.label}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BlockCategory;
