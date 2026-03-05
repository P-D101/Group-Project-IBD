import { useEffect } from "react";
import { useState } from "react";
// import { Line } from "react-chartjs-2";
import { Chart } from "chart.js/auto";
import "chartjs-adapter-date-fns";
import Table from "../components/Table";
import BaseLayout from "../components/BaseLayout";
import { useNavigate } from "react-router-dom";
import React from "react";
import { set } from "date-fns";

function DashboardGraphs(){
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

    return      (  
        <div> 
            {/*to do: add 2 charts from databse data*/}
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
        </div>  
                     )

}

export default DashboardGraphs;