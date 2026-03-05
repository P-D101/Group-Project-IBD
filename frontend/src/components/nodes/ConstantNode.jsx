import { Handle, Position } from "@xyflow/react";


function ConstantNode({ id, data, selected }) {
    // Prefer value for constant nodes, fallback to label
    let display = "Constant";
    if (typeof data.value === "number" && !isNaN(data.value)) {
        display = String(data.value);
    } else if (data.label) {
        display = data.label;
    }
    return (
        <div className="react-flow__node-default">

            <div
                style={{
                    padding: "0.75rem 1.25rem",
                    background: selected ? "#e3f2fd" : "#fff",
                    border: "2px solid #1976d2",
                    borderRadius: "0.5rem",
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "#222",
                    minWidth: "80px",
                    textAlign: "center",
                    boxShadow: selected ? "0 0 0 2px #1976d2" : "none",
                }}
            >
                <div>{display}</div>
            </div>

            <Handle type="source" position={Position.Bottom} id="output" />
        </div>
    );
}

export default ConstantNode;