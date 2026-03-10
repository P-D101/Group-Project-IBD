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
    let [stats, setStats] = useState({"weekly_cost":"","last_week_cost":"","perc_change":"","service_categories":[]});
    let [loading, setLoading] = useState(false);
    
    let process_data = (data) => {
        console.log(data)
        let perc_change = 100 * ((data['week1'] - data['week2']) / data['week2'])
        let sign = perc_change > 0 ? '+' : ''
        let joined_data = []
        for (let i = 0; i < data["service_categories"].length; i++) {
            joined_data.push([data["service_categories"][i],data["service_costs"][i]])
        }

        let modified_data = {
            "weekly_cost": data['week0'].toFixed(2),
            "last_week_cost": data['week1'].toFixed(2),
            "perc_change": `${sign}${Math.round(perc_change,3)}`,
            "service_categories": joined_data
        }
        console.log(modified_data)
        setStats(modified_data)
    }
    
    
    async function getStats() {
        if (loading) return;
        setLoading(true)
        console.log("getStats is running...");

        try {
            const response = await fetch("http://127.0.0.1:5000/api/dashboard-data");
            if (!response.ok) {
                throw new Error("Failed to fetch response");
            }

            const data = await response.json();
            //alert("Backend sent: " + JSON.stringify(data));//for debugging
            process_data(data);
            setLoading(false);
        }
        catch (e){
            console.error("Error getting stats ", e)
            setLoading(false);
        }    

    }

    useEffect(() => {
        getStats();
    }, []);
    
    if (loading) return <p>Loading stats...</p>; 


    return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded shadow-sm">
                        <ul>
                            <li>
                                <h3 className="font-semibold">Weekly Cost</h3>
                                <p>{stats.weekly_cost}</p>
                            </li>
                            <li>
                                <h3 className="font-semibold">Last Weekly Cost</h3>
                                <p>{stats.last_week_cost}  ({stats.perc_change}%)</p>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-white p-4 rounded shadow-sm">
                        <h3 className="font-semibold">Top Service Category Spending</h3>
                        <ul>
                        {stats.service_categories.map(([category_name,service_cost]) => {
                            return <li>
                                <p>{category_name}</p>
                                <p>${service_cost.toFixed(2)}</p>
                            </li>
                        })}
                        
                        </ul>
                    </div>
                </div>
    )

}

export default StatsCards;