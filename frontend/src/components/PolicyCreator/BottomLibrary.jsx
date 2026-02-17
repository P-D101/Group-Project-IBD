import BlocksLibraryPanel from "./BlocksLibraryPanel";

function BottomLibrary({ expanded, onExpandToggle }) {
    const containerStyle = {
        backgroundColor: "#ffffff",
        borderTop: "1px solid #d0d0d0",
        borderRadius: expanded
            ? "0.375rem 0.375rem 0 0"
            : "0.375rem 0.375rem 0 0",
        boxShadow: "0 -1px 3px rgba(0, 0, 0, 0.05)",
        transition: "max-height 0.3s ease-in-out",
        maxHeight: expanded ? "40vh" : "3rem",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flex: "0 0 auto",
    };

    const headerStyle = {
        padding: "0.75rem 1rem",
        borderBottom: expanded ? "1px solid #d0d0d0" : "none",
        backgroundColor: "#f5f5f5",
        flex: "0 0 auto",
    };

    const buttonStyle = {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        backgroundColor: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: "0.875rem",
        fontWeight: "600",
        color: "#000000",
        padding: 0,
        transition: "color 0.2s",
        fontFamily: "inherit",
    };

    const handleMouseEnter = (e) => {
        e.target.style.color = "#1a4d2e";
    };

    const handleMouseLeave = (e) => {
        e.target.style.color = "#000000";
    };

    const contentStyle = {
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
    };

    const arrowStyle = {
        display: "inline-block",
        transition: "transform 0.3s",
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <button
                    style={buttonStyle}
                    onClick={onExpandToggle}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <span style={arrowStyle}>▼</span>
                    <span>Blocks Library</span>
                </button>
            </div>
            {expanded && (
                <div style={contentStyle}>
                    <BlocksLibraryPanel />
                </div>
            )}
        </div>
    );
}

export default BottomLibrary;
