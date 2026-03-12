import Row from "./Row";
import THead from "./THead";
import { PropagateLoader } from "react-spinners";

function TableBody({ headers, rows, loading }) {
    return (
        <div className="flex-1 overflow-auto">
            <table className="min-w-full table-fixed divide-y divide-gray-200">
                <THead headers={headers} />
                <tbody className="bg-white divide-y divide-gray-100">
                    {loading && (
                        <tr>
                            <td colSpan={headers.length} className="py-10">
                                <div className="flex w-full flex-col items-center justify-center gap-4 text-center">
                                    <p className="text-sm font-medium text-gray-600">Loading provider usage table...</p>
                                    <PropagateLoader color="green" />
                                </div>
                            </td>
                        </tr>
                    )}
                    
                    
                    {rows.map((r, i) => (
                        <Row key={i} cells={r} highlight="light" />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TableBody;
