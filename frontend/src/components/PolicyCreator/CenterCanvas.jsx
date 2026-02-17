import FlowchartCanvas from "./FlowchartCanvas";

function CenterCanvas({ template, selectedBlock, onBlockSelect }) {
    const mainStyle = {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
    };

    return (
        <main style={mainStyle}>
            <FlowchartCanvas
                blocks={template?.vplBlocks || []}
                selectedBlock={selectedBlock}
                onBlockSelect={onBlockSelect}
            />
        </main>
    );
}

export default CenterCanvas;
