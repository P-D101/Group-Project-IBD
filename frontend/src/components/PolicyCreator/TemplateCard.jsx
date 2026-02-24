function TemplateCard({ template, isSelected, onSelect }) {
    const containerStyle = {
        padding: "0.75rem",
        marginBottom: "0.5rem",
        backgroundColor: isSelected ? "#1a4d2e" : "#f5f5f5",
        border: isSelected ? "2px solid #1a4d2e" : "1px solid #d0d0d0",
        borderRadius: "0.375rem",
        cursor: "pointer",
        transition: "all 0.2s",
    };

    const handleMouseEnter = (e) => {
        if (!isSelected) {
            e.currentTarget.style.backgroundColor = "#e8e8e8";
            e.currentTarget.style.borderColor = "#1a4d2e";
        }
    };

    const handleMouseLeave = (e) => {
        if (!isSelected) {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
            e.currentTarget.style.borderColor = "#d0d0d0";
        }
    };

    const titleStyle = {
        fontSize: "0.875rem",
        fontWeight: "600",
        color: isSelected ? "#ffffff" : "#000000",
        margin: "0 0 0.25rem 0",
    };

    const descriptionStyle = {
        fontSize: "0.75rem",
        color: isSelected ? "#e0e0e0" : "#666666",
        margin: 0,
        lineHeight: "1.4",
    };

    return (
        <div
            style={containerStyle}
            onClick={() => onSelect(template)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div style={titleStyle}>{template["Policy Name"]}</div>
            <p style={descriptionStyle}>{template.Description}</p>
        </div>
    );
}

export default TemplateCard;
