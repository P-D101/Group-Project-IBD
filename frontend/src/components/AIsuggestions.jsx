import { useEffect, useRef } from "react";
import { useState } from "react";
// import { Line } from "react-chartjs-2";
import { Chart } from "chart.js/auto";
import "chartjs-adapter-date-fns";
import Table from "../components/Table";
import BaseLayout from "../components/BaseLayout";
import { useNavigate } from "react-router-dom";
import React from "react";
import { set } from "date-fns";

function AIsuggestions(){
    let [suggested_tickets, setSuggTickets]= useState([]);
    let [loading, setLoading] = useState(true);
    const hasFetched = useRef(false)
    async function getSuggestions() {
        console.log("getSuggestions is running...");

        try {
            const response = await fetch("http://127.0.0.1:5000/api/suggestions");
            if (!response.ok) {
                throw new Error("Failed to fetch response");
            }

            const data = await response.json();
            //alert("Backend sent: " + JSON.stringify(data));//for debugging
            setSuggTickets(data.suggested_tickets);
            setLoading(false);
        }
        catch (e){
            console.error("Error getting stats ", e)
            setLoading(false);
        }   

    }

    useEffect(() => {
        if (!hasFetched.current){
            hasFetched.current = true; //don't reload suggestions again
            getSuggestions();}
    }, []);
    
    if (loading) return <p>Loading ticket recommendations...</p>; 


    function handleReject(removeIndex) {
        alert('Removed!')
        const newTickets = suggested_tickets.filter((_, index) => index !== removeIndex);
        setSuggTickets(newTickets);
    }

    function handleApprove(approveIndex){
        //nothing here yet as this service is not integrated
        alert('Suggested ticket sent to HR to confirm!')
    }

    return (

            <div>

                <div className="gap-6 flex overflow-x-auto scrollbar-hide  ">
                    {suggested_tickets.map((ticket, index) => (
                        <div
                            key={ticket.title}
                            className={"bg-white relative p-4 rounded border-slate-100 shadow-sm flex-shrink-0 w-100 w-80 min-h-[250px] flex flex-col justify-between"}
                        >
                            <div className="flex justify-between items-start mb-2">
                            <h3 className="text-md font-bold tracking-wide  pr-4 leading-tight">
                                {ticket.title} 
                            </h3>
                                <span className="whitespace-nowrap px-2 py-0.5 bg-[#002e5a] text-[10px] font-bold text-white rounded uppercase tracking-tighter">
                                
                                    Priority{" "}: {ticket.priority}
                                </span>
                            </div>

                            <p className="text-xs pb-2">{ticket.description}.</p>

                            <div className="bg-slate-50 p-3 rounded-lg mb-2 border border-slate-100">
                            <p className="text-[10px] font-bold tracking-wider text-[#158173]">Suggested Action: </p>
                            <p className="text-xs mt-1 text-slate-700">{ticket.action}</p>
                            </div>

                            <div className="bg-[#f3f0ff]/50 p-3 rounded-lg mb-4 border border-[#e9e3ff]/40">
                            <p className="text-[10px] font-bold italic tracking-wider text-[#6366f1]">Reasoning: </p>
                            <p className="text-xs mt-1 text-slate-700 italic">{ticket.reasoning}</p>
                            </div>
                            
                            <div className=" mt-auto grid grid-cols-1 md:grid-cols-2 gap-2 pt-4">
                                <button 
                                onClick={() => handleApprove(index)}
                                className=" gap-4 px-2 py-1 bg-[#1b6a5e] text-white rounded-full hover:bg-[#1b6a5e]/80 hover:shadow-md ">
                                    Approve{" "}
                                </button>
                                <button 
                                onClick={() => handleReject(index)}
                                className=" gap-4 px-2 py-1 bg-[#163158] text-white rounded-full hover:bg-[#163158]/80 hover:shadow-md ">
                                    Reject{" "}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
    )

}

export default AIsuggestions;