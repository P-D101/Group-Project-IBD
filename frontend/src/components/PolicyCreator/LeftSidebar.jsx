import TemplatesList from "./TemplatesList";

function LeftSidebar({ templates, selectedTemplate, onTemplateSelect }) {
    const sidebarStyle = {
        display: "flex",
        flexDirection: "column",
        flex: "0 0 auto",
    };

    return (
        <aside style={sidebarStyle}>
            <TemplatesList
                templates={templates}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={onTemplateSelect}
            />
        </aside>
    );
}

export default LeftSidebar;
