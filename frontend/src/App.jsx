import Table from "./components/Table";
import { Route, Routes } from "react-router-dom";
import AIdashboard from "./pages/AIdashboard";
import PolicyCreator from "./pages/PolicyCreator";
import ServiceViewer from "./pages/ServiceViewer";
import TempPage from "./pages/TempPage";
import BaseLayout from "./components/BaseLayout";

function App() {
    return (
        //<main className="w-screen h-screen">
        //  <Table />
        //</main>

        <Routes>
            <Route element = {<BaseLayout />}>
            <Route index element={<Table />} />
            <Route path="/ai-dashboard" element={<AIdashboard />} />
            <Route path="/service-viewer" element={<ServiceViewer />} />
            <Route path="/policy-editor" element={<PolicyCreator />} />
            <Route path="/service-viewer" element={<ServiceViewer />} />
            <Route path="/db-test" element={<TempPage />} />
            </Route>    
        </Routes>
    );
}

export default App;
