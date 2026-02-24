import BlockCategory from "./BlockCategory";

function BlocksLibraryPanel() {
    const BLOCK_CATEGORIES = [
        {
            title: "Inputs",
            blocks: [
                { type: "input", label: "Usage %" },
                { type: "input", label: "Daily Cost" },
                { type: "input", label: "Custom Metric" },
            ],
        },
        {
            title: "Components",
            blocks: [
                { type: "const", label: "Constant" },
                { type: "add", label: "Add" },
                { type: "subtract", label: "Subtract" },
                { type: "multiply", label: "Multiply" },
                { type: "divide", label: "Divide" },
            ],
        },
        {
            title: "Decisions",
            blocks: [
                { type: "lt", label: "Less Than (<)" },
                { type: "gt", label: "Greater Than (>)" },
                { type: "eq", label: "Equals (=)" },
                { type: "and", label: "AND" },
                { type: "or", label: "OR" },
            ],
        },
        {
            title: "Outputs",
            blocks: [
                { type: "output", label: "Create Ticket" },
                { type: "output", label: "Send Notification" },
                { type: "output", label: "Log Event" },
            ],
        },
    ];

    const containerStyle = {
        padding: "1rem",
        display: "flex",
        gap: "2rem",
        overflowX: "auto",
    };

    return (
        <div style={containerStyle}>
            {BLOCK_CATEGORIES.map((category) => (
                <BlockCategory
                    key={category.title}
                    title={category.title}
                    blocks={category.blocks}
                />
            ))}
        </div>
    );
}

export default BlocksLibraryPanel;
