import { useState, useEffect } from "react";
import Table from "../components/Table";

function ServiceViewer() {
    const providers = ["AWS", "Oracle", "Google Cloud", "Microsoft"];
    const [loading,setLoading] = useState(true);

    const [rows, setRows] = useState([]);

    useEffect(() => {
        async function load() {
            try {
                const results = await Promise.all(
                    providers.map(provider =>
                        fetch(`http://localhost:5000/api/usage/monthly?provider=${encodeURIComponent(provider)}`)
                            .then(r => {console.log(r); return r})
                            .then(r => r.json())
                            .then(data => {
                                let monthly_usage = `$${(data[0][1]).toFixed(2)}`;
                                let monthly_billed = `$${(data[0][2]).toFixed(2)}`;
                                let diff = `$${(data[0][2] - data[0][1]).toFixed(2)}`;
                                return [provider, monthly_usage, monthly_billed, diff]

                            })
                    )
                );

                setRows(results);
                setLoading(false)
            } catch (err) {
                console.error(err);
            }
        }

        load();
    }, []);

    

    return (
        <div className="flex flex-col bg-gray-50">

            {/* Main Content Area */}
            <div className="flex gap-4 p-4 overflow-hidden flex-1">
                {/* Center Services Table */}
                <Table headers={[{txt:"Provider",width:1},{txt:"Monthly Usage (USD)",width:1},{txt:"Monthly Billed (USD)",width:1},{txt:"Monthly Difference (USD)",width:1}]} rows={rows} loading={loading}></Table>
            </div>
        </div>
    );
}

export default ServiceViewer;
