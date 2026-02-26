const reserved = ["payload"];

function BlockPropertiesPanel({ block, onBlockUpdate }) {
    const panelStyle = {
        width: "320px",
        backgroundColor: "#ffffff",
        border: "1px solid #d0d0d0",
        borderRadius: "0.375rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    };

    const headerStyle = {
        padding: "1rem",
        borderBottom: "1px solid #d0d0d0",
        backgroundColor: "#f5f5f5",
    };

    const headerTitleStyle = {
        margin: 0,
        fontSize: "0.875rem",
        fontWeight: "700",
        color: "#000000",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    };

    const bodyStyle = {
        flex: 1,
        overflowY: "auto",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    };

    const labelStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "0.375rem",
    };

    const labelTextStyle = {
        fontSize: "0.75rem",
        fontWeight: "600",
        color: "#000000",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    };

    const inputStyle = {
        padding: "0.5rem",
        border: "1px solid #d0d0d0",
        borderRadius: "0.25rem",
        fontSize: "0.875rem",
        fontFamily: "inherit",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxSizing: "border-box",
    };

    const textareaStyle = {
        ...inputStyle,
        minHeight: "80px",
        resize: "vertical",
        fontFamily: "inherit",
    };

    const readOnlyInputStyle = {
        ...inputStyle,
        backgroundColor: "#f3f3f3",
        color: "#777777",
        cursor: "not-allowed",
    };

    const emptyStateStyle = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        color: "#999999",
        textAlign: "center",
        fontSize: "0.875rem",
        fontStyle: "italic",
    };

    const handleFocus = (e) => {
        e.target.style.borderColor = "#1a4d2e";
        e.target.style.boxShadow = "0 0 0 2px rgba(26, 77, 46, 0.1)";
    };

    const handleBlur = (e) => {
        e.target.style.borderColor = "#d0d0d0";
        e.target.style.boxShadow = "none";
    };

    const actionBoxStyle = {
        marginTop: "auto",
        paddingTop: "1rem",
        borderTop: "1px solid #d0d0d0",
    };

    const saveButtonStyle = {
        width: "100%",
        padding: "0.625rem",
        backgroundColor: "#1a4d2e",
        color: "#ffffff",
        border: "none",
        borderRadius: "0.25rem",
        fontSize: "0.875rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background-color 0.2s",
    };

    const handleButtonHover = (e) => {
        e.target.style.backgroundColor = "#0f3620";
    };

    const handleButtonLeave = (e) => {
        e.target.style.backgroundColor = "#1a4d2e";
    };

    const handleDescriptionChange = (value) => {
        if (!block) return;
        const updatedBlock = {
            ...block,
            ticket: {
                ...(block.ticket || {}),
            },
            description: value,
        };
        onBlockUpdate(updatedBlock);
    };

    if (!block) {
        return (
            <div style={panelStyle}>
                <div style={headerStyle}>
                    <h4 style={headerTitleStyle}>Block Properties</h4>
                </div>
                <div style={bodyStyle}>
                    <div style={emptyStateStyle}>Select a block to edit</div>
                </div>
            </div>
        );
    }

    const blockFieldKeys = Object.keys(block).filter(
        (key) => key !== "description",
    );

    const formatLabel = (key) =>
        key
            .replace(/_/g, " ")
            .replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.slice(1));

    return (
        <div style={panelStyle}>
            <div style={headerStyle}>
                <h4 style={headerTitleStyle}>Block Properties</h4>
            </div>
            <div style={bodyStyle}>
                {blockFieldKeys.map(
                    (key) =>
                        reserved.includes(key) || (
                            <label style={labelStyle} key={key}>
                                <span style={labelTextStyle}>
                                    {formatLabel(key)}
                                </span>
                                <input
                                    type="text"
                                    value={block[key]}
                                    disabled
                                    style={readOnlyInputStyle}
                                />
                            </label>
                        ),
                )}

                <label style={labelStyle}>
                    <span style={labelTextStyle}>Description</span>
                    <textarea
                        placeholder="Describe what this block does..."
                        value={block.description || ""}
                        onChange={(e) =>
                            handleDescriptionChange(e.target.value)
                        }
                        style={textareaStyle}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                </label>

                <div style={actionBoxStyle}>
                    <button
                        style={saveButtonStyle}
                        onClick={() => console.log("Block saved:", block)}
                        onMouseEnter={handleButtonHover}
                        onMouseLeave={handleButtonLeave}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BlockPropertiesPanel;
