import BlockPropertiesPanel from "./BlockPropertiesPanel";

function RightSidebar({ selectedBlock, onBlockUpdate }) {
    const sidebarStyle = {
        display: "flex",
        flexDirection: "column",
        flex: "0 0 auto",
    };

    return (
        <aside style={sidebarStyle}>
            <BlockPropertiesPanel
                block={selectedBlock}
                onBlockUpdate={onBlockUpdate}
            />
        </aside>
    );
}

export default RightSidebar;
