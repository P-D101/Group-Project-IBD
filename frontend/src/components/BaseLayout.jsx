import React from "react";  
import { Outlet } from "react-router-dom";
import Breadcrumbs from "./Breadcrumbs";
import CaleroLogo from "./assets/Variant=Calero-white.png"

function BaseLayout() {
    return (

        <div>


        <div className="flex items-center justify-between px-6 py-4 bg-[#191d29] border-b border-slate-800">
    
            <div className="flex items-center gap-3 text-xl font-bold text-white">
                <img 
                    src={CaleroLogo} 
                    alt="Calero" 
                    onClick={() => {
                        setCurrPage("ai-dashboard"); 
                        navigate("/ai-dashboard");
                    }}
                    className="h-6 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"/>
                    <span className="md:block">Cloud Server Management</span>
            </div>

            <div className="flex items-center gap-6">
                <div className="h-8 w-8 bg-[#ff6b00] rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
                    OP
                </div>
            </div>

        </div>
  

            <div className="bg-[#191d29] border-b border-slate-800">
                <Breadcrumbs />
            </div>

            <main className="flex-grow">
                
                <Outlet />
            </main>

        </div>

        );
}

export default BaseLayout;
