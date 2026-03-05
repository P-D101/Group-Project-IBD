import React from "react";
import DateSelector from "./DatePicker";

function DateRangeSelector({ value, onAfter, onBefore, onChange }) {
  const after = value?.after ?? null;
  const before = value?.before ?? null;

  const emitRange = (nextAfter, nextBefore) => {
    onChange?.({ after: nextAfter, before: nextBefore });
    onAfter?.(nextAfter);
    onBefore?.(nextBefore);
  };

  function updateAfter(newDate) {
    let adjustedBefore = before;

    if (before && newDate && newDate > before) {
      adjustedBefore = newDate;
    }

    emitRange(newDate, adjustedBefore);
  }

  function updateBefore(newDate) {
    let adjustedAfter = after;

    if (after && newDate && newDate < after) {
      adjustedAfter = newDate;
    }

    emitRange(adjustedAfter, newDate);
  }

  return (
    <div>
      <div>
        <label>After:</label>
        <DateSelector value={after} onChange={updateAfter} />
      </div>

      <div>
        <label>Before:</label>
        <DateSelector value={before} onChange={updateBefore} />
      </div>
    </div>
  );
}

export default DateRangeSelector;