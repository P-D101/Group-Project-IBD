import Table from "./components/Table";
import NavigationTabs from "./components/NavigationTabs";
import { Route, Routes } from "react-router-dom";
import AIdashboard from "./pages/AIdashboard";
import PolicyCreator from "./pages/PolicyCreator";
import Home from "./pages/Home";
import Server from "./pages/Server";

function App() {
    return (
        <>
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-2 py-1 rounded"
            >
                Skip to content
            </a>

            <div className="min-h-screen flex flex-col bg-gray-50">
                <header className="site-header">
                    <div className="container">
                        <div className="site-logo">
                            <span className="logo-mark" aria-hidden="true"></span>
                            <span className="sr-only">Application</span>
                        </div>

                        <NavigationTabs />
                    </div>
                </header>

                <main id="main" className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
                    <Routes>
                        <Route index element={<Home />} />
                        <Route path="/ai-dashboard" element={<AIdashboard />} />
                        <Route path="/policy-editor" element={<PolicyCreator />} />
                        <Route path="/server/:id" element={<Server />} />
                    </Routes>
                </main>

                <footer className="bg-white border-t">
                    <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
                        © {new Date().getFullYear()} Intuitive Business Data
                    </div>
                </footer>
            </div>
        </>
    );
}

export default App;
