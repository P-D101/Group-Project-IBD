import React, { useEffect, useState } from "react";
import DateRangeSelector from "../UI/DateRangeSelector";

const AGGREGATE_OPTIONS = [
  { value: "Average", label: "Average" },
  { value: "Variance", label: "Variance" },
  { value: "Minimum", label: "Min" },
  { value: "Maximum", label: "Max" },
  { value: "Sum", label: "Sum" },
  { value: "Count", label: "Count" },
  { value: "Percentile", label: "Percentile (n)" },
];

const TYPE_OPTIONS = [
  { value: "Compute", label: "Compute" },
  { value: "Storage", label: "Storage" },
  { value: "Network", label: "Network" },
  { value: "Control Plane", label: "Control Plane" },
  { value: "All types", label: "All" },
];

function InputBlock({ onChange, value = {} }) {
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loadingFields || fields.length > 0) return; // Don't fetch if already loading or have data
    setLoadingFields(true);
    fetch("http://localhost:5000/api/input_fields")
      .then((res) => res.json())
      .then((data) => {
        setFields(data || []);
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
      maxWidth: 300,
      boxShadow: "0 2px 8px rgba(26, 77, 46, 0.08)",
    }}>
      <h3 style={{ marginBottom: "1rem", color: "#1976d2" }}>INPUT</h3>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: 600 }}>Field*:</label>
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
            <option value="" disabled>Select field</option>
            {fields.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        )}
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: 600 }}>Aggregate*:</label>
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
        <label style={{ fontWeight: 600 }}>Type*:</label>
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
        <label style={{ fontWeight: 600 }}>Date Selection:</label>
        <DateRangeSelector
          value={{ after: value?.after ?? null, before: value?.before ?? null }}
          onChange={(range) => {
            onChange && onChange({ ...value, ...range });
          }}
        />
      </div>
    </div>
    
  );
}

export default InputBlock;
