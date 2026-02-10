import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function Sparkline({ values = [], stroke = "#3b82f6" }) {
    const path = values
        .map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${100 - v}`)
        .join(" ");
    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="sparkline">
            <polyline fill="none" stroke={stroke} strokeWidth="2" points={path} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function genMockSeries(seed = 50, len = 30) {
    const arr = [];
    let v = seed;
    for (let i = 0; i < len; i++) {
        v += (Math.random() - 0.45) * 10;
        v = Math.max(0, Math.min(100, v));
        arr.push(Math.round(v));
    }
    return arr;
}

export default function Server() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [period, setPeriod] = useState("7d");

    const policies = useMemo(
        () => [
            { id: "p-1", title: "Scale down low usage", description: "Scale down instances when usage < 20%" },
            { id: "p-2", title: "Alert on cost spike", description: "Notify finance when daily cost exceeds threshold" },
            { id: "p-3", title: "Throttle non-essential jobs", description: "Reduce background jobs during peak hours" },
        ],
        []
    );

    const usageSeries = useMemo(() => genMockSeries(40, 30), []);
    const costSeries = useMemo(() => genMockSeries(20, 30).map((v) => Math.round(v * 1.6)), []);
    const anomalies = useMemo(() => genMockSeries(10, 30).map((v) => (v > 85 ? 1 : 0)), []);

    return (
        <div className="server-page">
            <div className="server-grid">
                <div className="server-left">
                    <div className="server-topbar">
                        <h2 className="server-title">{`Cloud Server: ${id}`}</h2>
                        <div className="period-select">
                            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                                <option value="24h">24h</option>
                                <option value="7d">7d</option>
                                <option value="30d">30d</option>
                            </select>
                        </div>
                    </div>

                    <div className="chart-panel">
                        <div className="chart-header">
                            <h4>Usage</h4>
                            <button className="small-plus" onClick={() => alert("Add computed channel (mock)")}>+</button>
                        </div>
                        <div className="chart"><Sparkline values={usageSeries} stroke="#2563eb" /></div>
                    </div>

                    <div className="chart-panel">
                        <div className="chart-header">
                            <h4>Cost</h4>
                            <button className="small-plus" onClick={() => alert("Add computed cost channel (mock)")}>+</button>
                        </div>
                        <div className="chart"><Sparkline values={costSeries} stroke="#ef4444" /></div>
                    </div>

                    <div className="chart-panel">
                        <div className="chart-header">
                            <h4>Anomalies</h4>
                            <button className="small-plus" onClick={() => alert("Inspect anomalies (mock)")}>+</button>
                        </div>
                        <div className="chart anomalies-grid">
                            {anomalies.map((a, i) => (
                                <div key={i} className={`anom ${a ? "anom-on" : ""}`}></div>
                            ))}
                        </div>
                    </div>

                    <div className="server-table">
                        <h4>Instances</h4>
                        <table className="simple-table">
                            <thead>
                                <tr>
                                    <th>Instance</th>
                                    <th>Usage</th>
                                    <th>Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>instance-1</td>
                                    <td>45%</td>
                                    <td>$120/day</td>
                                </tr>
                                <tr>
                                    <td>instance-2</td>
                                    <td>61%</td>
                                    <td>$80/day</td>
                                </tr>
                                <tr>
                                    <td>instance-3</td>
                                    <td>12%</td>
                                    <td>$15/day</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <aside className="server-policies">
                    <div className="policies-header">
                        <h4>Policies</h4>
                        <button className="add-policy" onClick={() => navigate(`/policy-editor?new=true`)}>+</button>
                    </div>

                    <div className="policies-list">
                        {policies.map((p) => (
                            <div key={p.id} className="policy-item" onClick={() => navigate(`/policy-editor?policy=${p.id}`)}>
                                <div className="policy-title">{p.title}</div>
                                <div className="policy-desc">{p.description}</div>
                                <div className="policy-actions">
                                    <button className="edit-btn" onClick={() => navigate(`/policy-editor?policy=${p.id}`)}>Edit</button>
                                    <button className="disable-btn" onClick={() => alert('Disabled (mock)')}>Disable</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
}
