import React, { useState } from "react";

import TemplatesList from "./TemplatesList";
import DataSourceSelection from "./DataSourceSelection";


function LeftSidebar({
    templates,
    selectedTemplate,
    onTemplateSelect,
    dataSources,
    onDataSourcesChange,
}) {
    const sidebarStyle = {
        display: "flex",
        flexDirection: "column",
        flex: "0 0 auto",
    };

    const [currPage, setCurrPage] = useState("data-source");

    const selectedStyle = "pb-2 px-1 border-b-2 border-[#158173] text-[#158173] font-medium flex items-center gap-2";
    const deselectedStyle = "pb-2 px-1 border-b-2 border-transparent text-slate-500 hover:text-[#158173] font-medium transition-all"

    return (
        <aside style={sidebarStyle}>
            <div style={{"display": "flex", "gap": "10px"}} className="flex gap-8 border-b border-slate-200 mb-4">
                <button 
                    onClick={() => {
                        setCurrPage("data-source");
                    }}
                    className={currPage === "data-source" ? selectedStyle : deselectedStyle}>
                    Data Sources{" "}
                </button>
                <button
                    onClick={() => {
                        setCurrPage("template-policies");
                    }}
                    className={currPage === "template-policies" ? selectedStyle : deselectedStyle}
                >
                    Template Policies{" "}
                </button>
            </div>
            {currPage == "data-source" && (
                <DataSourceSelection 
                    dataSources={dataSources}
                    onDataSourcesChange={onDataSourcesChange}
                />
            )}
            {currPage == "template-policies" && (
                <TemplatesList
                    templates={templates}
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={onTemplateSelect}
                />
            )}
            
        </aside>
    );
}

export default LeftSidebar;
