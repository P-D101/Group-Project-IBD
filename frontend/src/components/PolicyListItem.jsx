import React from "react";

function PolicyListItem({ policy }) {
    return (
        <li key={policy["Policy Name"]}>
            <h3>Policy Name: {policy["Policy Name"]}</h3>
            <button
                onClick={() => {
                }}
                className="text-white gap-4 px-2 py-1 bg-[#84a49f]  rounded-lg hover:bg-[#1b6a5e] hover:shadow-md"
            >
                Edit
            </button>

            <button
                onClick={() => {
                }}
                className="text-white gap-4 px-2 py-1 bg-[#84a49f]  rounded-lg hover:bg-[#1b6a5e] hover:shadow-md"
            >
                Delete
            </button>
        </li>
    );
}

export default PolicyListItem;