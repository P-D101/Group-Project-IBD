import { useEffect } from "react";
import { useState } from "react";
// import { Line } from "react-chartjs-2";
import { Chart } from "chart.js/auto";
import "chartjs-adapter-date-fns";
import Table from "../components/Table";
import { useNavigate } from "react-router-dom";

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

    useEffect(() => {
        console.log("AIdashboard useEffect called"); // Debugging log

        var ctx = document.getElementById("serverGraph");
        var ctx2 = document.getElementById("serverGraph2");
        var currentGraph = Chart.getChart(ctx); // <canvas> id
        var currentGraph2 = Chart.getChart(ctx2); // <canvas> id
        if (currentGraph2) {
            currentGraph.destroy();
        }
        if (currentGraph) {
            currentGraph2.destroy();
        }
        if (ctx) {
            ctx.getContext("2d"); //make sure only 2d
            var serverGraph = new Chart(ctx, {
                type: "line",
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                },
                data: {
                    //dummy data
                    labels: [
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                    ],
                    datasets: [
                        {
                            label: "Server Usage",
                            data: [65, 59, 80, 81, 56, 55],
                            borderColor: "rgba(75, 192, 192, 1)",
                            size: 2,
                            fill: false,
                            tension: 0.1,
                        },
                    ],
                },
            });
        }

        //same for graph 2
        if (ctx2) {
            ctx2.getContext("2d");
            var serverGraph2 = new Chart(ctx2, {
                type: "bar",
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                },
                data: {
                    labels: [
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                    ],
                    datasets: [
                        {
                            label: "Server Usage",
                            data: [65, 59, 80, 81, 56, 55],
                            backgroundColor: "#163158",
                            borderColor: "#8d94a9",
                            borderWidth: 1,
                        },
                    ],
                },
            });
        }
    }, []);
    return (
        <div className="bg-[#e8ebed]">
            {/* Main Container */}
            <header className="items-left px-6 py-4 bg-[#191d29] border-b">
                <header className="text-xl font-bold text-white">
                    Calero Cloud Server Management
                </header>
            </header>

            <div style={styles.pageContainer} className="p-6">
                <h3 className="text-lg font-semibold pt-4">Welcome User</h3>

                {/* Navigation Tabs */}
                <div style={styles.navRow} className="">
                    <button className=" gap-4 px-2 py-1 bg-[#1b6a5e] text-indigo-600 rounded-lg hover:bg-[#1b6a5e] text-white">
                        Insights{" "}
                    </button>
                    <button
                        onClick={() => {
                            setCurrPage("policy-editor");
                            navigate("/policy-editor");
                        }}
                        className="text-white gap-4 px-2 py-1 bg-[#84a49f]  rounded-lg hover:bg-[#1b6a5e] hover:shadow-md"
                    >
                        Policy Creation{" "}
                    </button>
                </div>

                {/* AI Query Input */}
                <input
                    style={styles.inputBox}
                    placeholder="Enter AI query here"
                ></input>
                {/* need to add python script for AI recommendations*/}

                {/*scrollable ticket suggestions with dummy tickets for now*/}
                <h3 className="text-lg font-semibold pt-4">
                    AI Ticket Recommendations
                </h3>
                <div className="gap-6 flex overflow-x-auto scrollbar-hide  ">
                    {tickets.map((ticket, index) => (
                        <div
                            key={index}
                            className={` bg-white relative p-4 rounded shadow-sm flex-shrink-0 w-50 h-50`}
                        >
                            <h3 className="text-lg font-semibold">
                                Ticket {index + 1}
                            </h3>
                            <p className="text-xs">{ticket}.</p>
                            <p className=" text-xs pt-2">Suggested Action</p>
                            <p className="text-xs pb-4">Reasoning...</p>

                            <div className=" h-1/5 md:absolute bottom-5 grid grid-cols-1 md:grid-cols-2 gap-2">
                                <button className=" gap-4 px-2 py-1 bg-[#1b6a5e] text-white rounded-lg hover:bg-[#84a49f] hover:shadow-md ">
                                    Approve{" "}
                                </button>
                                <button className=" gap-4 px-2 py-1 bg-[#163158] text-white rounded-lg hover:bg-indigo-100 hover:shadow-md ">
                                    Reject{" "}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Analytics Section - Summary */}
                <h3 className="text-lg font-semibold pt-4">
                    Data Analytics Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded shadow-sm">
                        <h3 className="">Stats Card</h3>
                        <p>View key metrics and insights here.</p>
                    </div>
                    <div className="bg-white p-4 rounded shadow-sm">
                        <h3 className="">Stats Card</h3>
                        <p>Track performance over time.</p>
                    </div>
                </div>
                {/*Server Graphs using dummy data for now*/}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 pb-20 relative w-full h-64 bg-white rounded shadow-sm">
                        <h3 className="text-center mt-4">Server Usage Graph</h3>
                        <canvas id="serverGraph"></canvas>
                    </div>
                    <div className="p-6 pb-20 relative w-full h-64 bg-white rounded shadow-sm">
                        <h3 className="text-center mt-4">Server Usage Graph</h3>
                        <canvas id="serverGraph2"></canvas>
                    </div>
                </div>
                {/* Server Data Table from components*/}
                <h3 className="text-lg font-semibold pt-4">
                    Cloud Usage Data Per Server
                </h3>

                <Table></Table>
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
    navRow: {
        display: "flex",
        gap: "10px",
    },
    inputBox: {
        padding: "10px",
        width: "100%",
        borderRadius: "4px",
        border: "1px solid #ccc",
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
