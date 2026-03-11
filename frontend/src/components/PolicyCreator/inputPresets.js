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
            aggregate: "average",
            type: "all",
            after: daysAgo(1)
        },
    },
    {
        label: "Average Daily Cost (last month)",
        inputConfig: {
            field: "net_cost",
            aggregate: "average",
            type: "all",
            ...lastMonthRange(),
        },
    },
    {
        label: "Total Cost (last month)",
        inputConfig: {
            field: "billed_cost",
            aggregate: "sum",
            type: "all",
            ...lastMonthRange(),
        },
    },
    {
        label: "Daily Usage",
        inputConfig: {
            field: "usage_quantity",
            aggregate: "average",
            type: "all",
        },
    },
    {
        label: "Usage %",
        inputConfig: {
            field: "usage_percent",
            aggregate: "average",
            type: "all",
        },
    },
    {
        label: "Average Daily Usage (last month)",
        inputConfig: {
            field: "usage_quantity",
            aggregate: "average",
            type: "all",
            ...lastMonthRange(),
        },
    },
    {
        label: "Total Usage (last month)",
        inputConfig: {
            field: "usage_quantity",
            aggregate: "sum",
            type: "all",
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