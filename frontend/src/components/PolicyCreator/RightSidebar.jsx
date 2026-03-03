import BlockPropertiesPanelWithBoundary from "./BlockPropertiesPanel";

function RightSidebar({ selectedBlock, onBlockUpdate }) {
    const sidebarStyle = {
        display: "flex",
        flexDirection: "column",
        flex: "0 0 auto",
    };

    return (
        <aside style={sidebarStyle}>
            <BlockPropertiesPanelWithBoundary
                block={selectedBlock}
                onBlockUpdate={onBlockUpdate}
            />
        </aside>
    );
}

export default RightSidebar;
