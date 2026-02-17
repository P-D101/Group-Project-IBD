import React from "react";
import { useState } from "react";
//main page with AI input box, some ticket suggestions, analystics and server data table

/*
const AIdashboard = () => {
    return ( 
        <div className="AIdashboard">
            <h1>AI Dashboard</h1>
            <p>Welcome User.</p>
        </div>
     );
}*/

function AIdashboard() {
    const [blocksPanelExpanded, setBlocksPanelExpanded] = useState(false);

    return (
        <div style={styles.pageContainer} className="h-screen">
            {/* Main Container */}
            <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
                <header className="text-xl font-bold">
                    Calero Cloud Server Management
                </header>
            </header>
            <div className="h-full flex flex-col">
                <p>Welcome, User</p>

                {/* Navigation Tabs */}
                <div style={styles.navRow} className="">
                    <button>Insights</button>
                    <button>Policy Creation</button>
                </div>
                <div className="flex-1"></div>

                {/* AI Query Input */}
                <input
                    style={styles.inputBox}
                    placeholder="Enter AI query here"
                ></input>

                {/*scrollable ticket suggestions*/}
                <div className="container">
                    {tickets.map((src) => (
                        <div
                            key={src}
                            className="card"
                            style={{ ...styles.item, backgroundColor: src }}
                        />
                    ))}
                </div>
            </div>

            {/* Analytics Section */}

            {/* Server Data Table from components*/}
        </div>
    );
}

const tickets = ["bg-red-200", "bg-green-200", "bg-blue-200"];

const TicketCard = () => {
    return (
        <div style={styles.item}>
            {" "}
            <h3>Ticket Title</h3> <p>Short description of the ticket...</p>{" "}
        </div>
    );
};

const styles = {
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
