import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");

    const servers = [
        { id: "srv-1", name: "Cloud Server A", usage: "45%", cost: "$120/day", total: "$3600" },
        { id: "srv-2", name: "Cloud Server B", usage: "72%", cost: "$20/day", total: "$600" },
        { id: "srv-3", name: "Cloud Server C", usage: "38%", cost: "$150/day", total: "$4500" },
    ];

    return (
        <div className="home-page">
            <div className="ai-prompt">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask the AI about your cloud usage..."
                    className="ai-input"
                />
                <button className="ai-go" onClick={() => alert(`AI query: ${query}`)}>
                    Ask
                </button>
            </div>

            <div className="data-segments">
                <div className="segment">Data segment 1</div>
                <div className="segment">Data segment 2</div>
                <div className="segment">Data segment 3</div>
            </div>

            <div className="servers-table">
                <h3>Cloud servers</h3>
                <table className="simple-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Usage</th>
                            <th>Cost (daily)</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {servers.map((s) => (
                            <tr key={s.id} className="clickable-row" onClick={() => navigate(`/server/${s.id}`)}>
                                <td>{s.name}</td>
                                <td>{s.usage}</td>
                                <td>{s.cost}</td>
                                <td>{s.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Home;
