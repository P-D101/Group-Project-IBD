import BlockCategory from "./BlockCategory";

function BlocksLibraryPanel() {
    const BLOCK_CATEGORIES = [
        {
            title: "Inputs",
            blocks: [
                { id: "input-usage", type: "input", label: "Usage %" },
                { id: "input-cost", type: "input", label: "Daily Cost" },
                { id: "input-metric", type: "input", label: "Custom Metric" },
            ],
        },
        {
            title: "Components",
            blocks: [
                { id: "comp-const", type: "const", label: "Constant" },
                { id: "comp-add", type: "process", label: "Add" },
                { id: "comp-subtract", type: "process", label: "Subtract" },
                { id: "comp-multiply", type: "process", label: "Multiply" },
                { id: "comp-divide", type: "process", label: "Divide" },
            ],
        },
        {
            title: "Decisions",
            blocks: [
                { id: "decider-lt", type: "decider", label: "Less Than (<)" },
                {
                    id: "decider-gt",
                    type: "decider",
                    label: "Greater Than (>)",
                },
                { id: "decider-eq", type: "decider", label: "Equals (=)" },
                { id: "decider-and", type: "decider", label: "AND" },
                { id: "decider-or", type: "decider", label: "OR" },
            ],
        },
        {
            title: "Outputs",
            blocks: [
                { id: "output-ticket", type: "output", label: "Create Ticket" },
                {
                    id: "output-notify",
                    type: "output",
                    label: "Send Notification",
                },
                { id: "output-log", type: "output", label: "Log Event" },
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
