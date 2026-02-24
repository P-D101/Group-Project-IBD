import { useState } from "react";
import TemplateCard from "./TemplateCard";

function TemplatesList({ templates, selectedTemplate, onTemplateSelect }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTemplates = templates.filter(
        (t) =>
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const containerStyle = {
        width: "280px",
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

    const searchStyle = {
        padding: "0.75rem",
        borderBottom: "1px solid #d0d0d0",
    };

    const searchInputStyle = {
        width: "100%",
        padding: "0.5rem",
        border: "1px solid #d0d0d0",
        borderRadius: "0.25rem",
        fontSize: "0.875rem",
        fontFamily: "inherit",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxSizing: "border-box",
    };

    const listStyle = {
        flex: 1,
        overflowY: "auto",
        padding: "0.5rem",
    };

    const emptyStateStyle = {
        padding: "2rem 1rem",
        textAlign: "center",
        color: "#999999",
        fontSize: "0.875rem",
    };

    const handleSearchFocus = (e) => {
        e.target.style.borderColor = "#1a4d2e";
        e.target.style.boxShadow = "0 0 0 2px rgba(26, 77, 46, 0.1)";
    };

    const handleSearchBlur = (e) => {
        e.target.style.borderColor = "#d0d0d0";
        e.target.style.boxShadow = "none";
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h3 style={headerTitleStyle}>Template Policies</h3>
            </div>
            <div style={searchStyle}>
                <input
                    type="text"
                    placeholder="🔍 Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={searchInputStyle}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                />
            </div>
            <div style={listStyle}>
                {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            isSelected={selectedTemplate?.id === template.id}
                            onSelect={onTemplateSelect}
                        />
                    ))
                ) : (
                    <div style={emptyStateStyle}>No templates found</div>
                )}
            </div>
        </div>
    );
}

export default TemplatesList;
