import VPLNode from "./VPLNode";

function FlowchartCanvas({ blocks, selectedBlock, onBlockSelect }) {
    const canvasStyle = {
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#ffffff",
        border: "1px solid #d0d0d0",
        borderRadius: "0.375rem",
        overflow: "auto",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    };

    const emptyStateStyle = {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        color: "#999999",
        textAlign: "center",
        fontStyle: "italic",
    };

    const emptyStateTextStyle = {
        fontSize: "1rem",
        margin: "0.5rem 0",
    };

    if (!blocks || blocks.length === 0) {
        return (
            <div style={canvasStyle}>
                <div style={emptyStateStyle}>
                    <div style={emptyStateTextStyle}>
                        Select a template or add blocks using the library below
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={canvasStyle}>
            {blocks.map((block, index) => (
                <VPLNode
                    key={block.id}
                    block={block}
                    index={index}
                    isSelected={selectedBlock?.id === block.id}
                    onSelect={onBlockSelect}
                />
            ))}
        </div>
    );
}

export default FlowchartCanvas;
