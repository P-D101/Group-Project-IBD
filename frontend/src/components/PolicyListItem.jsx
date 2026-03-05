import React from "react";
import { useNavigate } from "react-router-dom";

function PolicyListItem({ policy, group }) {
    let navigate = useNavigate(); 
    const navigateToPolicy = () =>{ 
        let path = `/policy-editor/${policy.id}`; 
        navigate(path);
        console.log(policy)
    }
    const groupToColour = {"enabled":"bg-green-100","disabled":"bg-red-200","processing":"bg-yellow-100"}
    return (
        <li key={policy["Policy Name"]} className={"w-fit p-5 "+groupToColour[group]+" rounded-lg shadow-sm"}>
            <h3 className="text-l font-semibold mb-2">{policy["Policy Name"]}</h3>
            <button
                onClick={navigateToPolicy}
                className="text-white gap-4 px-2 py-1 mr-2 bg-[#84a49f]  rounded-lg hover:bg-[#1b6a5e] hover:shadow-md"
            >
                Edit
            </button>

            <button
                onClick={() => {
                }}
                className="text-white gap-4 px-2 py-1 mr-2 bg-[#84a49f]  rounded-lg hover:bg-[#1b6a5e] hover:shadow-md"
            >
                Delete
            </button>
        </li>
    );
}

export default PolicyListItem;