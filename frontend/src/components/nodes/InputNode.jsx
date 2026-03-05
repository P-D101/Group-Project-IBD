import { Handle, Position } from "@xyflow/react";


function formatDate(dateValue) {
    if (!dateValue) {
        return "";
    }
    const dateObj = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(dateObj.getTime())) {
        return "";
    }
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getInputSummary(inputConfig = {}) {
    console.log("Generating input summary for config:", inputConfig);
    const summary = [];
    if (inputConfig.field) summary.push(`Field: ${inputConfig.field}`);
    if (inputConfig.aggregate) summary.push(`Agg: ${inputConfig.aggregate}`);
    if (inputConfig.type) summary.push(`Type: ${inputConfig.type}`);

    const after = formatDate(inputConfig.after);
    const before = formatDate(inputConfig.before);
    if (after || before) {
        summary.push(`After: ${after || "-"}`);
        summary.push(`Before: ${before || "-"}`);
    }
    return summary;
}

function InputNode({ id, data, selected }) {
    const inputSummary = getInputSummary(data?.inputConfig || {});
    const display = data?.label || "INPUT";
    return (
        <div className="react-flow__node-default">
            <div style={{
                padding: "0.75rem",
                background: selected ? "#e3f2fd" : "#fff",
                border: "2px solid #1976d2",
                borderRadius: "0.5rem",
                fontWeight: 600,
                fontSize: "1rem",
                color: "#222",
                minWidth: "80px",
                textAlign: "center",
                boxShadow: selected ? "0 0 0 2px #1976d2" : "none",
            }}>
                <div>{display}</div>
                <div
                    style={{
                        marginTop: "0.45rem",
                        // borderTop: "1px solid #d0d0d0",
                        paddingTop: "0.45rem",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        lineHeight: 1.3,
                        color: "#555",
                        textAlign: "left",
                        minWidth: "190px",
                    }}
                >
                    {inputSummary.length > 0
                        ? inputSummary.map((line) => <div key={line}>{line}</div>)
                        : <div>Configure Input</div>}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} id="output" />
        </div>
    );
}

export default InputNode;