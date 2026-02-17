function VPLNode({ block, isSelected, onSelect, index }) {
    const nodeStyle = {
        position: "absolute",
        left: `${60 + index * 160}px`,
        top: "60px",
        width: "120px",
        backgroundColor: isSelected ? "#1a4d2e" : "#ffffff",
        border: isSelected ? "2px solid #1a4d2e" : "2px solid #d0d0d0",
        borderRadius: "0.5rem",
        padding: "0.75rem",
        cursor: "pointer",
        textAlign: "center",
        transition: "all 0.2s",
        boxShadow: isSelected
            ? "0 4px 12px rgba(26, 77, 46, 0.3)"
            : "0 1px 3px rgba(0, 0, 0, 0.1)",
    };

    const handleMouseEnter = (e) => {
        if (!isSelected) {
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
            e.currentTarget.style.borderColor = "#1a4d2e";
        }
    };

    const handleMouseLeave = (e) => {
        if (!isSelected) {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
            e.currentTarget.style.borderColor = "#d0d0d0";
        }
    };

    const typeStyle = {
        fontSize: "0.625rem",
        fontWeight: "700",
        color: isSelected ? "#ffffff" : "#999999",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        margin: "0 0 0.5rem 0",
    };

    const labelStyle = {
        fontSize: "0.875rem",
        fontWeight: "600",
        color: isSelected ? "#ffffff" : "#000000",
        margin: "0 0 0.5rem 0",
        wordBreak: "break-word",
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

    const handleButtonHover = (e) => {
        e.target.style.backgroundColor = "#0f3620";
    };

    const handleButtonLeave = (e) => {
        e.target.style.backgroundColor = "#1a4d2e";
    };

    return (
        <div
            style={nodeStyle}
            onClick={() => onSelect(block)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div style={typeStyle}>{block.type}</div>
            <div style={labelStyle}>{block.label}</div>
            <button
                style={buttonStyle}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(block);
                }}
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
            >
                +
            </button>
        </div>
    );
}

export default VPLNode;
