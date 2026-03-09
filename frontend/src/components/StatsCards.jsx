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

function StatsCards(){
    let [stats, setStats] = useState({weekly_variance: 0, top_service: 'Not Found', top_spend: 0});
    let [loading, setLoading] = useState(true);
    async function getStats() {
        console.log("getStats is running...");

        try {
            const response = await fetch("http://127.0.0.1:5000/api/dashboard-data");
            if (!response.ok) {
                throw new Error("Failed to fetch response");
            }

            const data = await response.json();
            //alert("Backend sent: " + JSON.stringify(data));//for debugging
            setStats(data);
            setLoading(false);
        }
        catch (e){
            console.error("Error getting stats ", e)
            setLoading(false);
        }    

    }

    useEffect(() => {
        getStats();}, []);
    
    if (loading) return <p>Loading stats...</p>; 


    return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded shadow-sm">
                        <h3 className="font-semibold">Weekly Variance</h3>
                        <p>{(stats.weekly_variance * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-white p-4 rounded shadow-sm">
                        <h3 className="font-semibold">Top Service and Spending</h3>
                        <p>{stats.top_service.toLocaleString()}</p>
                        <p>${(stats.top_spend).toFixed(1)}</p>
                    </div>
                </div>
    )

}

export default StatsCards;