import React from "react";  
import { Outlet } from "react-router-dom";
import Breadcrumbs from "./Breadcrumbs";

function BaseLayout() {
    return (

        <div>
            <div className="items-left px-6 py-4 bg-[#191d29] border-b">
                    <header className="text-xl font-bold text-white">
                        Calero Cloud Server Management
                    </header>
            </div>

            <main className="flex-grow">
                <Breadcrumbs/>
                <Outlet />
            </main>

        </div>

        );
}

export default BaseLayout;
