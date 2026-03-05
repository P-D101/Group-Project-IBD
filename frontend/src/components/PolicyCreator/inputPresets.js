function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

function lastMonthRange() {
    return {
        after: daysAgo(30),
        before: new Date(),
    };
}

export const INPUT_BLOCK_PRESETS = [
    {
        label: "Custom Input",
        inputConfig: {},
    },
    {
        label: "Daily Cost",
        inputConfig: {
            field: "net_cost",
            aggregate: "Average",
            type: "All",
            after: daysAgo(1)
        },
    },
    {
        label: "Average Daily Cost (last month)",
        inputConfig: {
            field: "net_cost",
            aggregate: "Average",
            type: "All",
            ...lastMonthRange(),
        },
    },
    {
        label: "Total Cost (last month)",
        inputConfig: {
            field: "billed_cost",
            aggregate: "Sum",
            type: "All",
            ...lastMonthRange(),
        },
    },
    {
        label: "Daily Usage",
        inputConfig: {
            field: "usage_quantity",
            aggregate: "Average",
            type: "All",
        },
    },
    {
        label: "Average Daily Usage (last month)",
        inputConfig: {
            field: "usage_quantity",
            aggregate: "Average",
            type: "All",
            ...lastMonthRange(),
        },
    },
    {
        label: "Total Usage (last month)",
        inputConfig: {
            field: "usage_quantity",
            aggregate: "Sum",
            type: "All",
            ...lastMonthRange(),
        },
    },
];

export function buildInputLibraryBlocks() {
    return INPUT_BLOCK_PRESETS.map((preset) => ({
        type: "input",
        label: preset.label,
        inputConfig: { ...preset.inputConfig },
    }));
}