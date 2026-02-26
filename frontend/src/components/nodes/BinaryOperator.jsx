import { Handle, Position } from "@xyflow/react";

function BinaryOperator({ data }) {
    return (
        <div className="react-flow__node-default">
            <Handle
                type="target"
                position={Position.Top}
                id="arg-0"
                style={{ left: "25%" }}
            />

            <Handle
                type="target"
                position={Position.Top}
                id="arg-1"
                style={{ left: "75%" }}
            />

            <div>{data?.label || "OP"}</div>

            <Handle type="source" position={Position.Bottom} id="output" />
        </div>
    );
}

export default BinaryOperator;
