function Header({ onSave }) {
    const headerStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 1.5rem",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e0e0e0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    };

    const titleStyle = {
        fontSize: "1.25rem",
        fontWeight: "600",
        color: "#000000",
        margin: 0,
    };

    const buttonStyle = {
        padding: "0.625rem 1.5rem",
        fontSize: "0.875rem",
        fontWeight: "600",
        color: "#ffffff",
        backgroundColor: "#1a4d2e",
        border: "none",
        borderRadius: "0.375rem",
        cursor: "pointer",
        transition: "background-color 0.2s, box-shadow 0.2s",
    };

    const handleMouseEnter = (e) => {
        e.target.style.backgroundColor = "#0f3620";
        e.target.style.boxShadow = "0 2px 8px rgba(26, 77, 46, 0.3)";
    };

    const handleMouseLeave = (e) => {
        e.target.style.backgroundColor = "#1a4d2e";
        e.target.style.boxShadow = "none";
    };

    return (
        <header style={headerStyle}>
            <h1 style={titleStyle}>Policy Editor</h1>
            <button
                style={buttonStyle}
                onClick={onSave}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                Save Policy
            </button>
        </header>
    );
}

export default Header;
