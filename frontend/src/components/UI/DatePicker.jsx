import React, { useState, useMemo, useEffect } from "react";

function toInputDateString(date) {
  if (!date) return "";
  const dateObj = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dateObj.getTime())) return "";
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveOffsetDate(offsetValue, offsetUnit) {
  const today = new Date();
  const result = new Date(today);
  const value = Number(offsetValue);

  if (offsetUnit === "days") {
    result.setDate(today.getDate() - value);
  } else if (offsetUnit === "weeks") {
    result.setDate(today.getDate() - value * 7);
  } else if (offsetUnit === "months") {
    result.setMonth(today.getMonth() - value);
  } else if (offsetUnit === "years") {
    result.setFullYear(today.getFullYear() - value);
  }

  return result;
}

export default function DateSelector({ value, onChange }) {
  const [mode, setMode] = useState("date"); // "date" | "offset"
  const [selectedDate, setSelectedDate] = useState(toInputDateString(value));
  const [offsetValue, setOffsetValue] = useState(0);
  const [offsetUnit, setOffsetUnit] = useState("days"); // days | weeks | months

  useEffect(() => {
    setSelectedDate(toInputDateString(value));
  }, [value]);

  const resolvedDate = useMemo(() => {
    if (mode === "date" && selectedDate) {
      return new Date(selectedDate);
    }

    if (mode === "offset") {
      return resolveOffsetDate(offsetValue, offsetUnit);
    }

    return null;
  }, [mode, selectedDate, offsetValue, offsetUnit]);

  const emitDateChange = (nextDate) => {
    if (!nextDate || Number.isNaN(nextDate.getTime())) return;
    onChange?.(nextDate);
  };

  return (
    <div style={styles.container}>
      <div style={styles.toggleRow}>
        <button
          type="button"
          onClick={() => setMode("date")}
          style={mode === "date" ? styles.activeButton : styles.button}
        >
          Select Date
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("offset");
            emitDateChange(resolveOffsetDate(offsetValue, offsetUnit));
          }}
          style={mode === "offset" ? styles.activeButton : styles.button}
        >
          Offset
        </button>
      </div>

      {mode === "date" ? (
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            const nextValue = e.target.value;
            setSelectedDate(nextValue);
            if (!nextValue) return;
            emitDateChange(new Date(nextValue));
          }}
          style={styles.input}
        />
      ) : (
        <div style={styles.offsetRow}>
          <input
            type="number"
            min="0"
            value={offsetValue}
            onChange={(e) => {
              const nextValue = e.target.value;
              setOffsetValue(nextValue);
              emitDateChange(resolveOffsetDate(nextValue, offsetUnit));
            }}
            style={styles.smallInput}
          />

          <select
            value={offsetUnit}
            onChange={(e) => {
              const nextUnit = e.target.value;
              setOffsetUnit(nextUnit);
              emitDateChange(resolveOffsetDate(offsetValue, nextUnit));
            }}
            style={styles.select}
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
            <option value="years">Years</option>
          </select>

          <span style={{ fontSize: "0.85rem" }}>ago</span>
        </div>
      )}

      {resolvedDate && (
        <div style={styles.result}>
          {resolvedDate.toDateString()}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "0.9rem",
  },
  toggleRow: {
    display: "flex",
    gap: "0.25rem",
    marginBottom: "0.5rem",
  },
  button: {
    flex: 1,
    padding: "0.35rem",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  activeButton: {
    flex: 1,
    padding: "0.35rem",
    fontSize: "0.8rem",
    cursor: "pointer",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
  },
  input: {
    width: "100%",
    padding: "0.35rem",
    fontSize: "0.85rem",
  },
  offsetRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  smallInput: {
    width: "60px",
    padding: "0.3rem",
    fontSize: "0.85rem",
  },
  select: {
    padding: "0.3rem",
    fontSize: "0.85rem",
  },
  result: {
    marginTop: "0.5rem",
    fontSize: "0.85rem",
    fontWeight: "bold",
  },
};