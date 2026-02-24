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

    return (
        <div className="bg-[#e8ebed]">
            <ol className="flex items-center whitespace-nowrap pl-6">
                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join("/")}`;

                    return (
                        <Link
                            to={to}
                            className={`pt-4 pb-2 inline-flex items-center ${last ? "text-primary-focus" : "text-muted-foreground"}`}
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
                    );
                })}
            </ol>
        </div>
    );
}
export default Breadcrumbs;
