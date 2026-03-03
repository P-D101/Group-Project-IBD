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
        <div className="flex flex-col h-screen bg-gray-50">

            {/* Main Content Area */}
            <div className="flex gap-4 p-4 overflow-hidden flex-1">
                <div className="w-full h-full p-6 bg-white rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Policy Viewer</h3>
                    {groups.map(group => (
                        <div key={group} className="mb-8">
                            <h2 className="text-xl font-semibold capitalize mb-2">{group} policies</h2>
                            <ul className="space-y-4">
                                {policies[group].map(policy => (
                                    <PolicyListItem key={policy["Policy Name"]} policy={policy} />
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
