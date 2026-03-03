import React, { useEffect, useState } from "react";

const AGGREGATE_OPTIONS = [
  { value: "AVG", label: "Average" },
  { value: "VARIANCE", label: "Variance" },
  { value: "MIN", label: "Min" },
  { value: "MAX", label: "Max" },
  { value: "PERCENTILE", label: "Percentile (n)" },
];

const TYPE_OPTIONS = [
  { value: "COMPUTE", label: "Compute" },
  { value: "STORAGE", label: "Storage" },
  { value: "NETWORK", label: "Network" },
  { value: "CONTROL_PLANE", label: "Control Plane" },
  { value: "ALL", label: "All" },
];

function InputBlock({ onChange, value = {} }) {
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoadingFields(true);
    fetch("/api/input_fields")
      .then((res) => res.json())
      .then((data) => {
        setFields(data.fields || []);
        setLoadingFields(false);
      })
      .catch((err) => {
        setError("Failed to load input fields");
        setLoadingFields(false);
      });
  }, []);

  const handleChange = (key, val) => {
    onChange && onChange({ ...value, [key]: val });
  };

  return (
    <div style={{
      border: "2px solid #1976d2",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      background: "#f9f9f9",
      minWidth: 320,
      maxWidth: 400,
      boxShadow: "0 2px 8px rgba(26, 77, 46, 0.08)",
    }}>
      <h3 style={{ marginBottom: "1rem", color: "#1976d2" }}>INPUT</h3>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: 600 }}>Field:</label>
        {loadingFields ? (
          <span>Loading...</span>
        ) : error ? (
          <span style={{ color: "#d32f2f" }}>{error}</span>
        ) : (
          <select
            value={value.field || ""}
            onChange={e => handleChange("field", e.target.value)}
            style={{ marginLeft: 8, padding: "0.5rem", borderRadius: 4 }}
          >
            <option value="">Select field</option>
            {fields.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        )}
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: 600 }}>Aggregate:</label>
        <select
          value={value.aggregate || ""}
          onChange={e => handleChange("aggregate", e.target.value)}
          style={{ marginLeft: 8, padding: "0.5rem", borderRadius: 4 }}
        >
          <option value="">Select aggregate</option>
          {AGGREGATE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: 600 }}>Type:</label>
        <select
          value={value.type || ""}
          onChange={e => handleChange("type", e.target.value)}
          style={{ marginLeft: 8, padding: "0.5rem", borderRadius: 4 }}
        >
          <option value="">Select type</option>
          {TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: 600 }}>Between:</label>
        <input
          type="text"
          placeholder="Start"
          value={value.rangeStart || ""}
          onChange={e => handleChange("rangeStart", e.target.value)}
          style={{ marginLeft: 8, marginRight: 8, padding: "0.5rem", borderRadius: 4, width: 80 }}
        />
        <span>and</span>
        <input
          type="text"
          placeholder="End"
          value={value.rangeEnd || ""}
          onChange={e => handleChange("rangeEnd", e.target.value)}
          style={{ marginLeft: 8, padding: "0.5rem", borderRadius: 4, width: 80 }}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: 600 }}>Date/Offset from Today:</label>
        <input
          type="text"
          placeholder="e.g. 2026-03-03 or -7d"
          value={value.dateOffset || ""}
          onChange={e => handleChange("dateOffset", e.target.value)}
          style={{ marginLeft: 8, padding: "0.5rem", borderRadius: 4, width: 160 }}
        />
      </div>
    </div>
  );
}

export default InputBlock;
