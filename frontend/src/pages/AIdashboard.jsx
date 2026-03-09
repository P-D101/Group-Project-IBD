import { useEffect } from "react";
import { useState } from "react";
import { Chart } from "chart.js/auto";
import "chartjs-adapter-date-fns";
import Table from "../components/Table";
import AIquery from "../components/AIquery";
import AIsuggestions from "../components/AIsuggestions";
import StatsCards from "../components/StatsCards";
import DashboardGraphs from "../components/DashboardGraphs";
import BaseLayout from "../components/BaseLayout";
import { useNavigate } from "react-router-dom";
import React from "react";
import { set } from "date-fns";
import ServiceViewer from "./ServiceViewer";

const tickets = [
    "example ticket 1 policy text",
    "ticket 2 policy text",
    "recommendation for tickte 3",
    "tickte 4 policy text",
    "ticket 5 exmaple",
    "ticket 6 description",
];

const TicketCard = () => {
    return (
        <div style={styles.item}>
            {" "}
            <h3>Ticket Title</h3> <p>Short description of the ticket...</p>{" "}
        </div>
    );
};

//main page with AI input box, some ticket suggestions, analystics and server data table

function AIdashboard() {
    const [currPage, setCurrPage] = useState("ai-dashboard");
    const navigate = useNavigate();
    console.log("AIdashboard component rendered"); // Debugging log

   

    return (

        <div className="min-h-screen bg-[#dedee0]/20 text-[#020102]">

            <div style={styles.pageContainer} className="pb-6 pt-4 pl-6 pr-6">
                <h1 className="text-3xl font-bold tracking-tight text-[#020102] mb-2">
                        Welcome User
                    </h1>

                {/* Navigation Tabs */}
                <div style={styles.navRow} className="flex gap-8 border-b border-slate-200 mb-4">
                    {/*<button className=" gap-4 px-2 py-1 bg-[#1b6a5e] text-indigo-600 rounded-lg hover:bg-[#1b6a5e]/80 text-white">*/}
                    <button className="pb-2 px-1 border-b-2 border-[#158173] text-[#158173] font-medium flex items-center gap-2">
                        Insights{" "}
                    </button>
                    <button
                        onClick={() => {
                            setCurrPage("policy-editor");
                            navigate("/policy-editor");
                        }}
                        className="pb-2 px-1 border-b-2 border-transparent text-slate-500 hover:text-[#158173] font-medium transition-all"
                    >
                        Policy Creation{" "}
                    </button>
                    <button
                        onClick={() => {
                            setCurrPage("policy-viewer");
                            navigate("/policy-viewer");
                        }}
                        className="pb-2 px-1 border-b-2 border-transparent text-slate-500 hover:text-[#158173] font-medium transition-all"
                    >
                        Policy Viewer{" "}
                    </button>
                </div>

            <div>
                {/* AI Query Section */}
                <AIquery/>         
            
            </div>

                {/* AI Ticket Suggestions Section */}
            <div>
                {/*scrollable ticket suggestions*/}
                <h3 className="text-lg font-bold tracking-wide text-[#020102] pt-4 pb-2">
                    AI Ticket Recommendations
                </h3>
                   <AIsuggestions/>

            </div>

                {/* Analytics Section - Summary */}
                <h3 className="text-lg font-bold tracking-wide text-[#020102] pt-4 pb-2">
                    Data Analytics Overview
                </h3>

            <div>
                {/* Stats Cards Section */}
                <StatsCards/>

            </div>


<div>
        <DashboardGraphs></DashboardGraphs>
</div>


                {/* Server Data Table from components*/}
                <h3 className="text-lg font-bold tracking-wide text-[#020102] pt-4 pb-2">
                    Cloud Usage Data Per Server
                </h3>

                {/*<ServiceViewer></ServiceViewer>*/}
            </div>
        </div>
    );
}

const styles = {
    //main page container style
    pageContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },

    //navigation buttons style
    navRow: {
        display: "flex",
        gap: "10px",
    },
    //AI query input style
    inputBox: {
        padding: "10px",
        width: "100%",
        borderRadius: "4px",
        border: "1px solid #ffffff",
        backgroundColor: "#e1e7fa",
    },

    horizontalScroll: {
        display: "flex",
        overflowX: "scroll",
        gap: 10,
    },

    container: {
        display: "flex",
        overflowX: "scroll",
        width: "100%",
        padding: "20px",
    },
};

//table components
export default AIdashboard;
