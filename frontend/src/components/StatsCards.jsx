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
    let [stats, setStats] = useState({ monthly_variance: 0, savings_discounts: 0 });
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
            setLoading = false;
        }

        
        

    }

    useEffect(() => {
        getStats();}, []);
    
    if (loading) return <p>Loading stats...</p>; 


    return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded shadow-sm">
                        <h3 className="">Monthly Variance</h3>
                        <p>{(stats.monthly_variance * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-white p-4 rounded shadow-sm">
                        <h3 className="">Savings due to discounts</h3>
                        <p>${stats.savings_discounts.toLocaleString()}</p>
                    </div>
                </div>
    )

}

export default StatsCards;