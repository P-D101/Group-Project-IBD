import { useEffect, useMemo, useRef, useState } from "react";

const DATA_SOURCE_FIELDS = [
    "provider",
    "billing_account",
    "sub_account",
    "service_name",
    "application",
    "business_unit",
];

const SEARCHABLE_FIELDS = new Set(["application", "business_unit","service_name"]);
const MAX_VISIBLE_OPTIONS = 10;

const EMPTY_SELECTIONS = {};
const DATA_SOURCE_USED_FALSE = {};
const DATA_SORCE_ERROR_EMPTY = {};
for (let field of DATA_SOURCE_FIELDS) {
    EMPTY_SELECTIONS[field] = [];
    DATA_SOURCE_USED_FALSE[field] = false;
    DATA_SORCE_ERROR_EMPTY[field] = "";
}

function prettyFieldName(key) {
    return key
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}


// TODO remove if not neeeded
function uniqueStrings(values) {
    return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))];
}

function DataSourceSelection({ dataSources, onDataSourcesChange }) {
    const [fieldSearchTerms, setFieldSearchTerms] = useState({
        application: "",
        business_unit: "",
        service_name: ""
    });
    const [optionsByField, setOptionsByField] = useState({ ...EMPTY_SELECTIONS });
    const [loadingByField, setLoadingByField] = useState({ ...DATA_SOURCE_USED_FALSE });
    const [errorByField, setErrorByField] = useState({ ...DATA_SORCE_ERROR_EMPTY });

    const containerStyle = {
        width: "280px",
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

    const searchStyle = {
        padding: "0.75rem",
        borderBottom: "1px solid #d0d0d0",
    };

    const searchInputStyle = {
        width: "100%",
        padding: "0.5rem",
        border: "1px solid #d0d0d0",
        borderRadius: "0.25rem",
        fontSize: "0.875rem",
        fontFamily: "inherit",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxSizing: "border-box",
    };

    const optionsBoxStyle = {
        flex: 1,
        overflowY: "auto",
        padding: "0.5rem 0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
    };

    const fieldSearchWrapStyle = {
        marginBottom: "0.5rem",
    };

    const fieldGroupStyle = {
        border: "1px solid #d9d9d9",
        borderRadius: "0.375rem",
        padding: "0.625rem",
        backgroundColor: "#fcfcfc",
    };

    const fieldTitleStyle = {
        margin: 0,
        marginBottom: "0.5rem",
        fontWeight: 700,
        fontSize: "0.8rem",
        color: "#1f2937",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
    };

    const optionRowStyle = {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "0.82rem",
        color: "#111827",
        marginBottom: "0.35rem",
    };

    const allRowStyle = {
        ...optionRowStyle,
        fontWeight: 700,
        paddingBottom: "0.35rem",
        borderBottom: "1px solid #e5e7eb",
        marginBottom: "0.5rem",
    };

    const statusTextStyle = {
        marginTop: "0.25rem",
        fontSize: "0.75rem",
        color: "#6b7280",
    };

    const errorTextStyle = {
        ...statusTextStyle,
        color: "#b91c1c",
    };

    const handleSearchFocus = (e) => {
        e.target.style.borderColor = "#1a4d2e";
        e.target.style.boxShadow = "0 0 0 2px rgba(26, 77, 46, 0.1)";
    };

    const handleSearchBlur = (e) => {
        e.target.style.borderColor = "#d0d0d0";
        e.target.style.boxShadow = "none";
    };

    const buildApiFilters = (currentSelections, excludedField) => {
        const filters = {};
        for (const field of DATA_SOURCE_FIELDS) {
            if (field === excludedField) continue;
            const selectedValues = currentSelections[field] || [];
            if (selectedValues.length > 0) {
                filters[field] = selectedValues;
            }
        }
        return filters;
    };


    const fetchRawOptionsForField = async (field, currentSelections) => {
        const filters = buildApiFilters(currentSelections, field);

        try {
            const filteredResponse = await fetch(
                `http://localhost:5000/api/data/filtered/${field}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(filters)
                },
            );

            if (filteredResponse.ok) {
                const filteredJson = await filteredResponse.json();
                if (Array.isArray(filteredJson)) {
                    return uniqueStrings(filteredJson.map((value) => `${value}`));
                }
            }
        } catch (error) {
            if (error?.name === "AbortError") {
                throw error;
            }
        }

        const fallbackResponse = await fetch(`http://localhost:5000/api/data/${field}`, {
            method: "GET"
        });
        if (!fallbackResponse.ok) {
            throw new Error(`Unable to load options (${field})`);
        }
        const fallbackJson = await fallbackResponse.json();
        if (!Array.isArray(fallbackJson)) {
            return [];
        }
        return uniqueStrings(fallbackJson.map((value) => `${value}`));
    };

    useEffect(() => {
        let currentSelections;
        if (!dataSources) {
            currentSelections = {...EMPTY_SELECTIONS};
        } else {
            currentSelections = dataSources;
        };

        const refreshAllFields = async () => {
            const nextOptions = {};
            const nextErrors = {};
            const nextLoading = {};

            DATA_SOURCE_FIELDS.forEach((field) => {
                nextLoading[field] = true;
                nextErrors[field] = "";
            });
            setLoadingByField((prev) => ({ ...prev, ...nextLoading }));
            setErrorByField((prev) => ({ ...prev, ...nextErrors }));

            await Promise.all(
                DATA_SOURCE_FIELDS.map(async (field) => {
                    try {
                        const fetched = await fetchRawOptionsForField(
                            field,
                            currentSelections
                        );
                        const selected = currentSelections[field] || [];
                        // instead first sort selected, then concat with sorted fetched
                        nextOptions[field] = uniqueStrings([...fetched, ...selected]).sort(
                            (a, b) => a.localeCompare(b),
                        );
                    } catch (error) {
                        if (error?.name === "AbortError") return;
                        nextOptions[field] = uniqueStrings(currentSelections[field] || []);
                        nextErrors[field] = "Refresh failed. Preserving current selections.";
                    } finally {
                        nextLoading[field] = false;
                    }
                }),
            );

            setOptionsByField((prev) => ({ ...prev, ...nextOptions }));
            setErrorByField((prev) => ({ ...prev, ...nextErrors }));
            setLoadingByField((prev) => ({ ...prev, ...nextLoading }));

            const pruned = DATA_SOURCE_FIELDS.reduce((acc, field) => {
                const available = new Set(nextOptions[field] || []);
                acc[field] = (currentSelections[field] || []).filter((item) => available.has(item));
                return acc;
            }, {});

            const changed = DATA_SOURCE_FIELDS.some((field) => {
                const before = currentSelections[field] || [];
                const after = pruned[field] || [];
                return before.length !== after.length || before.some((value, idx) => value !== after[idx]);
            });

            if (changed) {
                onDataSourcesChange(pruned);
            }
            
        };
        refreshAllFields()
    }, [dataSources, onDataSourcesChange]);

    const setFieldSelection = (field, nextValues) => {
        const sanitized = uniqueStrings(nextValues);
        onDataSourcesChange({
            ...dataSources,
            [field]: sanitized,
        });
    };

    const toggleAllForField = (field) => {
        const allOptions = optionsByField[field] || [];
        const selected = dataSources[field] || [];
        const allSelected = allOptions.length > 0 && selected.length === allOptions.length;
        setFieldSelection(field, allSelected ? [] : allOptions);
    };

    const toggleOption = (field, option) => {
        const selected = dataSources[field] || [];
        const exists = selected.includes(option);
        if (exists) {
            setFieldSelection(
                field,
                selected.filter((item) => item !== option),
            );
            return;
        }
        setFieldSelection(field, [...selected, option]);
    };

    const onFieldSearchChange = (field, value) => {
        setFieldSearchTerms((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h3 style={headerTitleStyle}>Data Sources</h3>
            </div>
            <div style={optionsBoxStyle}>
                {DATA_SOURCE_FIELDS.map((field) => {
                    const allOptions = optionsByField[field] || [];
                    const selected = dataSources[field] || [];
                    const isSearchableField = SEARCHABLE_FIELDS.has(field);
                    const loweredFieldSearch = (fieldSearchTerms[field] || "").trim().toLowerCase();
                    const matchingOptions =
                        isSearchableField && loweredFieldSearch
                            ? allOptions.filter((option) =>
                                  option.toLowerCase().includes(loweredFieldSearch),
                              )
                            : allOptions;
                    const visibleOptions = matchingOptions.slice(0, MAX_VISIBLE_OPTIONS);

                    const allSelected =
                        allOptions.length > 0 && selected.length === allOptions.length;

                    return (
                        <div key={field} style={fieldGroupStyle}>
                            <p style={fieldTitleStyle}>
                                {prettyFieldName(field)} ({selected.length}/{allOptions.length})
                            </p>

                            {isSearchableField && (
                                <div style={fieldSearchWrapStyle}>
                                    <input
                                        type="text"
                                        placeholder={`Search ${prettyFieldName(field)}...`}
                                        value={fieldSearchTerms[field] || ""}
                                        onChange={(e) => onFieldSearchChange(field, e.target.value)}
                                        style={searchInputStyle}
                                        onFocus={handleSearchFocus}
                                        onBlur={handleSearchBlur}
                                    />
                                </div>
                            )}

                            <label style={allRowStyle}>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={() => toggleAllForField(field)}
                                />
                                All
                            </label>

                            {visibleOptions.length === 0 ? (
                                <p style={statusTextStyle}>No options available.</p>
                            ) : (
                                visibleOptions.map((option) => (
                                    <label key={`${field}-${option}`} style={optionRowStyle}>
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(option)}
                                            onChange={() => toggleOption(field, option)}
                                        />
                                        {option}
                                    </label>
                                ))
                            )}

                            {matchingOptions.length > MAX_VISIBLE_OPTIONS && (
                                <p style={statusTextStyle}>
                                    Showing first {MAX_VISIBLE_OPTIONS} of {matchingOptions.length} matches.
                                </p>
                            )}

                            {/* {loadingByField[field] && (
                                <p style={statusTextStyle}>Updating options in background...</p>
                            )} */}
                            {errorByField[field] && (
                                <p style={errorTextStyle}>{errorByField[field]}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default DataSourceSelection;
