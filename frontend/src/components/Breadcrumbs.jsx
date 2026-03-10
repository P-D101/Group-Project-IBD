import React from "react";
import { Link, useLocation } from "react-router-dom";

function Breadcrumbs() {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter((x) => x);

    function getDisplayName(urlname) {
        switch (urlname) {
            case "ai-dashboard":
                return "Home";
            case "service-viewer":
                return "Service Viewer";
            case "policy-editor":
                return "Policy Editor";
            default:
                return urlname.charAt(0).toUpperCase() + urlname.slice(1);
        }
    }
    var logical_pathnames = pathnames.map(x=>x)
    // if the start of the pathnames is not "ai-dashboard", then we want to add it to the beginning of the pathnames array
    if (pathnames.length === 0 || pathnames[0] !== "ai-dashboard") {
        logical_pathnames.unshift("ai-dashboard");
    }

    return (
        <div className="bg-transparent text-white">
            <ol className="flex items-center whitespace-nowrap pl-6">
                {logical_pathnames.map((value, index) => {
                    let to;
                    const last = index === logical_pathnames.length - 1;
                    if (value == "ai-dashboard") {
                        to = '/ai-dashboard';   
                    } else {
                        to = `/${pathnames.slice(0, index).join("/")}`;
                    }
                    
                    
                    console.log(value, index)
                    return (
                        <li>
                            <Link
                            to={to}
                            className={` pb-2 inline-flex items-center ${last ? "text-primary-focus" : "text-muted-foreground"}`}
                            key={index}
                        >
                            {getDisplayName(value)}
                            <svg
                                className="shrink-0 mx-2 size-4 text-muted-foreground"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </Link>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
export default Breadcrumbs;
