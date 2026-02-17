import { useState } from "react";
import Table from "../components/Table";

function ServiceViewer() {
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="flex justify-end items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
                header section
            </header>

            {/* Main Content Area */}
            <div className="flex gap-4 p-4 overflow-hidden flex-1">
                {/* Center Services Table */}
                <Table></Table>
            </div>
        </div>
    );
}

export default ServiceViewer;
