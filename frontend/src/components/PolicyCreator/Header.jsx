import { useState } from "react";

function Header({ onSave, policyName, setPolicyName }) {
    const [isFocused, setIsFocused] = useState(false);

    const headerStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 1.5rem",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e0e0e0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    };

    const nameInputStyle = {
        background: "none",
        fontSize: "1.25rem",
        fontWeight: "600",
        borderBottom: "none",
        outline: "none",
        ...(isFocused && {
            color: "#000000",
            borderBottom: "2.5px solid #1a4d2e",
            padding: "0.1rem 0.25rem 0.25rem 0",
            transition: "border-color 0.2s",
        }),
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
            <input
                style={nameInputStyle}
                type="text"
                placeholder="Enter Policy Name"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
            />
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
