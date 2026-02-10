import Row from "./Row";
import THead from "./THead";

function TableBody({ headers, rows }) {
    return (
        <div className="flex-1 overflow-auto">
            <table className="min-w-full table-fixed divide-y divide-gray-200">
                <THead headers={headers} />
                <tbody className="bg-white divide-y divide-gray-100">
                    {rows.map((r, i) => (
                        <Row key={i} cells={r} highlight="light" />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TableBody;
