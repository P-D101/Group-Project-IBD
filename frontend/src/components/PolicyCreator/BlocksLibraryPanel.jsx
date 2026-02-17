import BlockCategory from "./BlockCategory";

function BlocksLibraryPanel() {
    const BLOCK_CATEGORIES = [
        {
            title: "Inputs",
            blocks: [
                { id: "input-usage", label: "Usage %" },
                { id: "input-cost", label: "Daily Cost" },
                { id: "input-metric", label: "Custom Metric" },
            ],
        },
        {
            title: "Components",
            blocks: [
                { id: "comp-const", label: "Constant" },
                { id: "comp-add", label: "Add" },
                { id: "comp-subtract", label: "Subtract" },
                { id: "comp-multiply", label: "Multiply" },
                { id: "comp-divide", label: "Divide" },
            ],
        },
        {
            title: "Decisions",
            blocks: [
                { id: "decider-lt", label: "Less Than (<)" },
                { id: "decider-gt", label: "Greater Than (>)" },
                { id: "decider-eq", label: "Equals (=)" },
                { id: "decider-and", label: "AND" },
                { id: "decider-or", label: "OR" },
            ],
        },
        {
            title: "Outputs",
            blocks: [
                { id: "output-ticket", label: "Create Ticket" },
                { id: "output-notify", label: "Send Notification" },
                { id: "output-log", label: "Log Event" },
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
