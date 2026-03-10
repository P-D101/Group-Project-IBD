import React, { useState, useEffect } from "react";
import InputBlock from "./InputBlock";

const reserved = ["payload"];

export default function BlockPropertiesPanel({ block, onBlockUpdate }) {
  const panelStyle = {
    width: "320px",
    backgroundColor: "#ffffff",
    border: "1px solid #d0d0d0",
    borderRadius: "0.375rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const headerStyle = {
    padding: "1rem",
    borderBottom: "1px solid #d0d0d0",
    backgroundColor: "#f5f5f5",
  };

  const headerTitleStyle = {
    margin: 0,
    fontSize: "0.875rem",
    fontWeight: "700",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const bodyStyle = {
    flex: 1,
    overflowY: "auto",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const labelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
  };

  const labelTextStyle = {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const inputStyle = {
    padding: "0.5rem",
    border: "1px solid #d0d0d0",
    borderRadius: "0.25rem",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: "80px",
    resize: "vertical",
    fontFamily: "inherit",
  };

  const readOnlyInputStyle = {
    ...inputStyle,
    backgroundColor: "#f3f3f3",
    color: "#777777",
    cursor: "not-allowed",
  };

  const emptyStateStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    color: "#999999",
    textAlign: "center",
    fontSize: "0.875rem",
    fontStyle: "italic",
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = "#1a4d2e";
    e.target.style.boxShadow = "0 0 0 2px rgba(26, 77, 46, 0.1)";
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = "#d0d0d0";
    e.target.style.boxShadow = "none";
  };

  const actionBoxStyle = {
    marginTop: "auto",
    paddingTop: "1rem",
    borderTop: "1px solid #d0d0d0",
  };

  const saveButtonStyle = {
    width: "100%",
    padding: "0.625rem",
    backgroundColor: "#1a4d2e",
    color: "#ffffff",
    border: "none",
    borderRadius: "0.25rem",
    fontSize: "0.875rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  };

  const handleButtonHover = (e) => {
    e.target.style.backgroundColor = "#0f3620";
  };

  const handleButtonLeave = (e) => {
    e.target.style.backgroundColor = "#1a4d2e";
  };

  const handleDescriptionChange = (value) => {
    if (!block) return;
    const updatedBlock = {
      ...block,
      ticket: {
        ...(block.ticket || {}),
      },
      description: value,
    };
    onBlockUpdate(updatedBlock);
  };

  const handleTicketRecipientChange = (value) => {
    if (!block) return;
    const nextPayload = {
      ...(block.payload || {}),
      recipient: value,
    };
    onBlockUpdate({ ...block, payload: nextPayload });
  };

  if (!block || typeof block !== "object") {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <h4 style={headerTitleStyle}>Block Properties</h4>
        </div>
        <div style={bodyStyle}>
          <div style={emptyStateStyle}>
            Select a block to edit or block data is missing.
          </div>
        </div>
      </div>
    );
  }

  const blockFieldKeys = Object.keys(block).filter(
    (key) => key !== "description",
  );
  const formatLabel = (key) =>
    key
      .replace(/_/g, " ")
      .replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.slice(1));

  // State for constant value editing and error
  const [constValue, setConstValue] = useState(
    block.type === "const"
      ? block.value !== undefined
        ? block.value
        : block.label
      : "",
  );
  const [constError, setConstError] = useState("");

  useEffect(() => {
    if (block.type === "const") {
      setConstValue(
        block.value !== undefined ? block.value : block.label || "",
      );
      setConstError("");
      return;
    }
    setConstValue("");
    setConstError("");
  }, [block.id, block.type, block.value, block.label]);

  const handleConstChange = (e) => {
    const val = e.target.value;
    setConstValue(val);
    // Validate float
    if (val.trim() === "" || isNaN(parseFloat(val))) {
      setConstError("Constant value must be a valid float.");
    } else {
      setConstError("");
    }
  };

  const handleSaveConst = () => {
    if (`${constValue}`.trim() === "" || isNaN(parseFloat(constValue))) {
      setConstError("Constant value must be a valid float.");
      return;
    }
    setConstError("");
    onBlockUpdate({
      ...block,
      value: parseFloat(constValue),
      label: constValue,
    });
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h4 style={headerTitleStyle}>Block Properties</h4>
      </div>

      <div style={bodyStyle}>
        {block.type === "const" ? (
          <label style={labelStyle}>
            <span style={labelTextStyle}>Constant Value</span>
            <input
              type="text"
              value={constValue}
              onChange={handleConstChange}
              style={
                constError
                  ? { ...inputStyle, borderColor: "#d32f2f" }
                  : inputStyle
              }
              output
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            {constError && (
              <span style={{ color: "#d32f2f", fontSize: "0.8em" }}>
                {constError}
              </span>
            )}
          </label>
        ) : block.type === "input" ? (
          <InputBlock
            value={block.inputConfig || {}}
            onChange={(cfg) => onBlockUpdate({ ...block, inputConfig: cfg })}
          />
        ) : (
          block.type === "ticket" && (
            <label style={labelStyle}>
              <span style={labelTextStyle}>Recipient</span>
              <input
                type="text"
                value={block?.payload?.recipient ?? ""}
                placeholder="Ticket Recipient (email)"
                onChange={(e) => handleOutputMessageChange(e.target.value)}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </label>
          )
        )}

        <label style={labelStyle}>
          <span style={labelTextStyle}>Description</span>
          <textarea
            placeholder={
              block.description && block.description.trim() !== ""
                ? block.description
                : "Describe what this block does..."
            }
            value={block.description || ""}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            style={textareaStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </label>

        <div style={actionBoxStyle}>
          <button
            style={saveButtonStyle}
            onClick={
              block.type === "const"
                ? handleSaveConst
                : () => console.log("Block saved:", block)
            }
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
