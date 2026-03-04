import { useState, useEffect } from "react";
import PolicyListItem from "../components/PolicyListItem";

function PolicyViewer() {

    const groups = ["enabled","disabled","processing"]
    const [policies, setPolicies] = useState(Object.fromEntries(groups.map(group => [group,[]])));
    
    useEffect(() => {
        async function load() {
            try {
                const id_results = await fetch(`http://localhost:5000/api/policies`).then(r=>r.json());

                const results = await Promise.all(
                    groups.map(group =>
                        Promise.all(
                            id_results.vpl_ids[group].map(id =>
                                fetch(`http://localhost:5000/api/policies/${id}`)
                                .then(r => r.json()))))
                );

                const policiesObject = Object.fromEntries(groups.map(group => [group,[]]));
                for (let i = 0; i < groups.length; i++) {
                    policiesObject[groups[i]] = results[i];
                }
                setPolicies(policiesObject);
                console.log(policiesObject);
            } catch (err) {
                console.error(err);
            }
        }

        load();
    }, []);

    return (
        <div className="flex flex-col h-[80vh] bg-gray-50">

            {/* Main Content Area */}
            <div className="flex gap-4 p-4 h-[80vh] flex-1">
                <div className="w-full p-6 bg-white rounded-lg shadow-sm flex space-x-8">
                        {groups.map(group => (
                            <div key={group} className="flex-1 bg-gray-100 p-5 rounded-lg overflow-auto">
                                <h2 className="text-xl font-semibold capitalize mb-2">{group} policies</h2>
                                <ul className="space-y-4">
                                    {policies[group].map(policy => (
                                        <PolicyListItem policy={policy} group={group}/>
                                    ))}
                                </ul>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}

export default PolicyViewer;
