// import { useState } from "react";
import Table from "../components/Table";

function ServiceViewer() {
    const providers = ['AWS', 'Oracle', 'Google Cloud', 'Microsoft']
    
    const headers = [{ txt: "Service Name", width: 1 },
    { txt: "Billing (Monthly)", width: 2 },
    { txt: "Billing (pp)", width: 1 },
    { txt: "Quota usage%", width: 1 },
    { txt: "Renewal date", width: 1 },
    { txt: "Renewal period", width: 1 },
    { txt: "Essential", width: 1 }]

    React.useEffect(() => {
    fetch(`/api/usage/monthly?provider={}`)
      .then(r => r.json())
      .then(setRows);
  }, []);

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="flex justify-end items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
                header section
            </header>

            {/* Main Content Area */}
            <div className="flex gap-4 p-4 overflow-hidden flex-1">
                {/* Center Services Table */}
                <Table headers={headers} rows={rows}></Table>
            </div>
        </div>
    );
}

export default ServiceViewer;
