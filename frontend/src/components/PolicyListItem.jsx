import React from "react";
import { useNavigate } from "react-router-dom";

function PolicyListItem({ policy, group, triggerReload }) {
    let navigate = useNavigate(); 
    const navigateToPolicy = () =>{ 
        let path = `/policy-editor/${policy.id}`; 
        navigate(path);
        console.log(policy)
    };

        
    const toggleStatus = async () => {
        await fetch(`http://localhost:5000/api/policies/${policy.id}/${group=="enabled"?"disable":"enable"}`,{method:"POST"});
        triggerReload();
    };

    const deletePolicy = async () => {
        if (!window.confirm(`Are you sure you want to delete ${policy["Policy Name"]}?`)) return;
        await fetch(`http://localhost:5000/api/policies/${policy.id}`,{method:"DELETE"});
        triggerReload();
    };


    const dataSources = (policy) => {
        if (!policy["Data Sources"] || policy["Data Sources"].length == 0) {
            return <b>"No data sources";</b>
        }
        // backwards compatibility for old policies without "Data Sources" field, treat as no data sources
        if (Array.isArray(policy["Data Sources"])) {
            return policy["Data Sources"].map(name => <div className="bg-blue-200 p-1 rounded-lg mt-2 w-fit">{name}</div>);
        }
        
        return <ul>
        {Object.keys(policy["Data Sources"]).map(key => {
            if (policy["Data Sources"][key].length == 0) return null; // if data source is marked as false, don't show it
            let name = key.split("_").join(" ")
            return <li className="bg-blue-200 p-1 rounded-lg mt-2 w-fit text-transform: capitalize">
                <p>{name}:{policy["Data Sources"][key].join(", ")}</p>
            </li>
        })}
        </ul>;
    };

    const groupToColour = {"enabled":"bg-green-100","disabled":"bg-red-200","processing":"bg-yellow-100"}
    return (
        <li key={policy["id"]} className={"w-fit p-5 "+groupToColour[group]+" rounded-lg shadow-sm"}>
            <h3 className="text-l font-semibold mb-2">{policy["Policy Name"]}</h3>

            {group != "processing"
            ? (
                <div>
                    <button
                        onClick={navigateToPolicy}
                        className="text-white gap-4 px-2 py-1 mr-2 bg-[#84a49f]  rounded-lg hover:bg-[#1b6a5e] hover:shadow-md"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => {
                            toggleStatus();
                        }}
                        className="text-white gap-4 px-2 py-1 mr-2 bg-[#84a49f]  rounded-lg hover:bg-[#1b6a5e] hover:shadow-md"
                    >
                        {group == "enabled" ? "Disable" : "Enable"}
                    </button>
                    <button
                        onClick={() => {
                            deletePolicy();
                        }}
                        className="text-white gap-4 px-2 py-1 mr-2 bg-[#84a49f]  rounded-lg hover:bg-[#1b6a5e] hover:shadow-md"
                    >
                        Delete
                    </button>
                </div>
            )
            : (<div>(note: can't edit whilst processing)</div>)}
            <div>
                {dataSources(policy)}
            </div>
            
        </li>
    );
}

export default PolicyListItem;