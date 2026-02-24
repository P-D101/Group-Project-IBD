import THead from "./THead";
import Row from "./Row";
import TableTitle from "./TableTitle";
import TableFooter from "./TableFooter";
import TableBody from "./TableBody";

function Table({ headers, rows }) {
    const outerBg = "bg-white";
    const containerBg = "bg-white border-gray-200";

    return (
        <div className={`w-full h-full p-6 ${outerBg}`}>
            <div
                className={`h-full rounded-lg ${containerBg} shadow-sm flex flex-col`}
            >
                <div className="bg-indigo-100 h-1 w-full rounded-t-lg" />

                <TableTitle />

                <TableBody headers={headers} rows={rows} />

                <TableFooter>Showing {rows.length} rows</TableFooter>
            </div>
        </div>
    );
}

export default Table;
