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
            const response = await fetch("http://127.0.0.1:5001/query", {
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

            <div className="mt-2 p-2 bg-[#163158]/50 rounded shadow-sm">
            <div>
                <h3 className="text-lg font-semibold pt-1">AI Query</h3>       
                <input
                    style={styles.inputBox}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter AI query here"
                />
                <div className="pt-2">
                <button 
                
                
                className=" gap-4 px-2 py-1 bg-[#163158] text-white rounded-lg hover:bg-[#163158]/60 hover:shadow-md " onClick={handleUserQuery} disabled={loading}>
                    {loading ? " Processing... Please wait " : "Submit Query"}
                </button>

                </div>
                {response && ( //can add feature to collapse this response box later (if have time)
                     <div className="mt-4 p-4 bg-white rounded shadow-sm">
                        <p>{response}</p>
                        <p>Visit page: </p>
                        {url && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 transition-colors">
                                    {url}
                            </a>
                        )}
                    </div>
                )}
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