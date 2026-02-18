import React from "react";
import {Link, useLocation} from "react-router-dom";

function Breadcrumbs() {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter((x) => x);

    function getDisplayName(urlname){
        switch (urlname) {
            case "ai-dashboard":
                return "Home";
            case "service-viewer":
                return "Service Viewer";
            case "policy-editor":
                return "Policy Editor";
            default:
                return urlname.charAt(0).toUpperCase() + urlname.slice(1);
        }   };
        
    return (
        <div className="bg-[#e8ebed]">
            <ol class="flex items-center whitespace-nowrap pl-6">


           

            {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        
        return (
            <Link to={to} class="pt-4 pb-2 inline-flex items-center">
                <a  class="flex items-center underline text-sm text-muted-foreground-1 hover:text-primary-focus hover:text-[#84a49f] focus:outline-hidden focus:text-primary-focus" href = {to}>
                {getDisplayName(value)}
                </a>
                <svg class="shrink-0 mx-2 size-4 text-muted-foreground"  width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
        )})}
            </ol>

            </div>
    );

}
export default Breadcrumbs;