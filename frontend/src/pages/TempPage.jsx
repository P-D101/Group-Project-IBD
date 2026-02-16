import { useEffect, useState } from "react";
import { Line } from 'react-chartjs-2';
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const formatTimeSeriesData = (data) => {
  return data.map(item => ({
    x: new Date(item[0]).toISOString(), // Convert string timestamp to Date object
    y: item[1],
  }));
};

const TimeSeriesChartComponent = ({service}) => {
  const [dataPoints, setDataPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/usage/hourly?provider=${service}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDataPoints(formatTimeSeriesData(data)); // Assuming data is an array of { time: '...', value: ... }
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const chartData = {
    datasets: [
      {
        label: `${service}`,
        data: dataPoints,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day", // change to 'day', 'minute', etc.
        },
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        title: {
          display: true,
          text: "£usage/hour",
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded shadow w-1/2 h-fit">
      <Line data={chartData} options={options} />
    </div>
  );
};

function TempPage() {
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="flex justify-end items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
                header section
            </header>

            {/* Main Content Area */}
            <div className="flex gap-4 p-4 overflow-hidden flex-1">
                {/* Button to show data */}
                <TimeSeriesChartComponent service="Oracle"/>
                <TimeSeriesChartComponent service="AWS"/>                
            </div>
        </div>
    );
}

export default TempPage;