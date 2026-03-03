import { useState, useEffect } from "react";
import Table from "../components/Table";

function ServiceViewer() {
    const providers = ["AWS", "Oracle", "Google Cloud", "Microsoft"];

    const [rows, setRows] = useState([]);

    useEffect(() => {
        async function load() {
            try {
                const results = await Promise.all(
                    providers.map(provider =>
                        fetch(`http://localhost:5000/api/usage/monthly?provider=${encodeURIComponent(provider)}`)
                            .then(r => {console.log(r); return r})
                            .then(r => r.json())
                            .then(data => [provider, data[0][1]] )
                    )
                );

                setRows(results);
            } catch (err) {
                console.error(err);
            }
        }

        load();
    }, []);

    return (
        <div className="flex flex-col h-screen bg-gray-50">

            {/* Main Content Area */}
            <div className="flex gap-4 p-4 overflow-hidden flex-1">
                {/* Center Services Table */}
                <Table headers={[{txt:"Provider",width:1},{txt:"Monthly Usage",width:1}]} rows={rows}></Table>
            </div>
        </div>
    );
}

export default ServiceViewer;
