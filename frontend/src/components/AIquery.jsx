import { useEffect } from "react";
import { useState } from "react";
import AIdashboard from "../pages/AIdashboard";
// import { Line } from "react-chartjs-2";
import { Chart } from "chart.js/auto";
import "chartjs-adapter-date-fns";
import Table from "../components/Table";
import BaseLayout from "../components/BaseLayout";
import { useNavigate } from "react-router-dom";
import React from "react";
import { set } from "date-fns";
import CaleroAI from "../components/assets/AnimatedGif.png"

function AIquery() {    
    //ai query state

    const [query, setQuery] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [url, setUrl] = useState("");

    async function handleUserQuery() {

        //query = "Tell me what the site does"; //example query for now, will get from input box later
        if (!query) return;
        setLoading(true);


        try {
            const response = await fetch("http://127.0.0.1:5000/api/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({query}),
            }) 

            if (!response.ok) {
                throw new Error("Failed to fetch AI response");
            }

            let output = await response.json(); //get result from backend
            console.log("AI response received:", output); // debugging log
            //alert("AI response received: " + output.response); // debugging
            setResponse(output.response);
            setLoading(false);
            setUrl(output.url); 
            } catch (error) {
                console.error("Error fetching AI response:", error);
            }finally{
                setLoading(false);
            }
        };


        return (

            <div className="p-4 bg-white  shadow-sm border border-slate-100">
            <div className="flex flex-col gap-4">
            <div className="flex flex-row items-center ">
                        <img 
                            src={CaleroAI}
                            alt="Calero AI Logo" 
                            className="pr-2 h-10 w-auto object-contain flex-shrink-0 " 
                        />
                    
                    <h3 className="text-xl font-bold text-[#020102] ">How can I help you today?</h3>  
            </div>
            <div>
                <p className="text-sm text-slate-500  mb-6 ml-2">
                    Ask me anything about navigating the site, including viewing and editing policies. </p>  
                <div className="relative group">
                <input
                    className="w-full p-4 pr-12 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#158173] outline-none transition-all placeholder:text-slate-400"
                    
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask Calero Assistant"
                />
                <div className="pt-2">
                <div className="absolute right-4 top-1/2 -translate-y-3/5 flex items-center gap-4 text-[#158173]">
                <button 
                className="transition-all hover:scale-101 disabled:opacity-50"
                //className=" gap-4 px-2 py-1 bg-[#163158] text-white rounded-lg hover:bg-[#163158]/60 hover:shadow-md " 
                onClick={handleUserQuery} disabled={loading}>
                    {loading ?

                    //loading ? " Processing... Please wait " : "Submit Query"
                    (<div className="w-6 h-6 pb-4 border-2 border-[#158173] border-t-transparent rounded-full animate-spin"></div>): 
                    (<span className="text-xl leading-none ">➤</span>)
                    
                    }
                </button>
                </div>
                </div>

                </div>
                {response && ( //can add feature to collapse this response box later (if have time)
                     //<div className="mt-4 p-4 bg-white rounded shadow-sm">
                     //<div className="mt-8 flex flex-col items-end">
                     <div className=" flex flex-col  ml-1">
                    <div className="p-4 bg-slate-100 rounded-2xl rounded-tl-none rounded-tr-none border border-slate-100">
                     <p className="text-[#020102] text-sm leading-relaxed">{response}</p>
                        <p>Visit page: </p>
                        {url && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 transition-colors">
                                    {url}
                            </a>
                        )}
                    </div>
                    </div>
                )}

                <div className="pt-4 border-t border-slate-50 flex justify-center">
                <p className="text-[11px] text-slate-400 text-center italic">
                    Calero AI can make mistakes, please review responses.
                </p>
            </div>
            </div>
            </div>

            </div>

        )

}

export default AIquery;

const styles = {
    inputBox: {
        padding: "10px",
        width: "100%",
        borderRadius: "4px",
        border: "1px solid #ffffff",
        backgroundColor: "#e1e7fa",
    }}