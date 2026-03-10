import React, { useEffect, useState, useRef } from "react";
import { Chart } from "chart.js/auto";
import "chartjs-adapter-date-fns";

function DashboardGraphs(){
    let [data, setData] = useState({daily_net_cost: [], usage_date:[], business_unit:[], total_cost:[]});
    let [loading, setLoading] = useState(true);

    const chartRef1 = useRef(null);
    const chartRef2 = useRef(null);

    async function getData() {
            console.log("getData is running...");
    
            try {
                const response = await fetch("http://127.0.0.1:5000/api/dashboard-graph");
                if (!response.ok) {
                    throw new Error("Failed to fetch response");
                }
    
                const json_result = await response.json();
                alert("Backend sent: " + JSON.stringify(data.business_unit));//for debugging
                setData(json_result);
                setLoading(false);
            }
            catch (e){
                console.error("Error getting stats ", e)
                setLoading(false);
            } 
        }
    
    useEffect(() => {getData();}, []);
    
    useEffect (() => {
        if (loading || !chartRef1.current || !chartRef2.current) return;

        const currentGraph = Chart.getChart(chartRef1.current); 
        const currentGraph2 = Chart.getChart(chartRef2.current); 
        if (currentGraph) {
            currentGraph.destroy();
        }
        if (currentGraph2) {
            currentGraph2.destroy();
        }

        new Chart(chartRef1.current, {
            type: "line",
            options: {responsive: true, maintainAspectRatio: false,

                scales: {
            x: {
                ticks: { maxTicksLimit: 8 } },}
            },
            data: {
                labels: data.usage_date,
                datasets: [{
                        label: "Daily Net Cost/$",
                        data: data.daily_net_cost,
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: "rgba(75, 192, 192, 0.1)",
                        size: 2,
                        fill: true,
                        tension: 0.2,
                        pointRadius: 2,
                        pointHoverRadius: 6,
                    },],
                    },
            });

        new Chart(chartRef2.current, {
            type: "bar",
            options: {responsive: true,maintainAspectRatio: false,},
            data: {
                labels: data.business_unit,
                datasets: [{
                        label: "Spending/$",
                        data: data.total_cost,
                        backgroundColor: "#163158",
                        borderColor: "#8d94a9",
                        borderWidth: 1,
                    }],
                },
            });
        },[loading, data]);

    if (loading) return <p>Loading graph...</p>; 
    


    return      (  
        <div> 
                    {/* Graph 1 using db data*/}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 pb-20 relative w-full h-96 bg-white rounded shadow-sm">
                            <h3 className="text-center mt-4">Daily Net Cost/$</h3>
                            <canvas ref ={chartRef1}></canvas>
                        </div>

                        {/*Graph 2 using db data*/}
                        <div className="p-6 pb-20 relative w-full h-96 bg-white rounded shadow-sm">
                            <h3 className="text-center mt-4">Top 10 Business Unit Spending</h3>
                            <canvas ref = {chartRef2}></canvas>
                        </div>
                </div>
        </div>  
    );
}


export default DashboardGraphs;