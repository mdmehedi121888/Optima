"use client";

import { useEffect, useState } from "react";
import { Search, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TooltipItem, ChartData } from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface OEERecord {
  id: number;
  station: string;
  productionDate: string;
  shift: string;
  shiftStartTime: string;
  shiftEndTime: string;
  hourlyOEE: {
    hour: string;
    availability: number;
    performance: number;
    quality: number;
    oee: number;
  }[];
  totalOEE: {
    shift: string;
    total_planned_minutes: number;
    total_running_minutes: number;
    total_downtime_minutes: number;
    total_achieved_qty: number;
    total_good_qty: number;
    availability: number;
    performance: number;
    quality: number;
    oee: number;
  };
  is_active: number;
  creator: string;
  sys_date_time: string;
  updated_at: string | null;
}

export default function OEEReports() {
  const [oeeRecords, setOEERecords] = useState<OEERecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 7;

  // Fetch OEE records
  const fetchOEERecords = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/oee-metrics/getAll", {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const { data } = await response.json();
      setOEERecords(data || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching OEE records:", error);
      setError("Failed to fetch OEE records. Check server status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOEERecords();
  }, []);

  // Filter and paginate OEE records
  const filteredOEERecords = oeeRecords
    .filter(
      (record) =>
        record.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.shift.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(record.productionDate).toLocaleDateString().includes(searchTerm)
    )
    .sort((a, b) => new Date(b.productionDate).getTime() - new Date(a.productionDate).getTime());

  const paginatedOEERecords = filteredOEERecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOEERecords.length / itemsPerPage);

  // Prepare data for bar chart (current page records)
  const getCurrentPageRecordsData = () => {
    const labels: string[] = paginatedOEERecords.map((record) =>
      new Date(record.productionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    );
    const availabilityData: number[] = paginatedOEERecords.map((record) => record.totalOEE.availability);
    const performanceData: number[] = paginatedOEERecords.map((record) => record.totalOEE.performance);
    const qualityData: number[] = paginatedOEERecords.map((record) => record.totalOEE.quality);
    const oeeData: number[] = paginatedOEERecords.map((record) => record.totalOEE.oee);

    return { labels, availabilityData, performanceData, qualityData, oeeData };
  };

  // Bar chart data
  const { labels, availabilityData, performanceData, qualityData, oeeData } = getCurrentPageRecordsData();
  const chartData: ChartData<"bar", number[], string> = {
    labels,
    datasets: [
      {
        label: "Availability",
        data: availabilityData,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "Performance",
        data: performanceData,
        backgroundColor: "rgba(255, 206, 86, 0.6)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      },
      {
        label: "Quality",
        data: qualityData,
        backgroundColor: "rgba(0, 128, 0, 0.6)",
        borderColor: "rgba(0, 128, 0, 1)",
        borderWidth: 1,
      },
      {
        label: "OEE",
        data: oeeData,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#333",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"bar">) => `${context.dataset.label}: ${(context.raw as number).toFixed(2)}%`,
        },
      },
      title: {
        display: true,
        text: "OEE Metrics for Current Page Records",
        color: "#333",
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Production Date",
          color: "#333",
        },
        ticks: {
          color: "#333",
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Percentage (%)",
          color: "#333",
        },
        ticks: {
          color: "#333",
          callback: (value: number | string) => `${value}%`,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const exportData = filteredOEERecords.map((record) => ({
        Station: record.station,
        Shift: record.shift,
        "Production Date": new Date(record.productionDate).toLocaleDateString(),
        "Availability (%)": record.totalOEE.availability.toFixed(2),
        "Performance (%)": record.totalOEE.performance.toFixed(2),
        "Quality (%)": record.totalOEE.quality.toFixed(2),
        "OEE (%)": record.totalOEE.oee.toFixed(2),
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      worksheet["!cols"] = [
        { wch: 15 }, // Station
        { wch: 10 }, // Shift
        { wch: 15 }, // Production Date
        { wch: 15 }, // Availability
        { wch: 15 }, // Performance
        { wch: 15 }, // Quality
        { wch: 10 }, // OEE
      ];

      // Create workbook and append worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "OEE Report");

      // Generate and download Excel file
      XLSX.writeFile(workbook, "OEE_Report.xlsx");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("Failed to export OEE data to Excel.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-full p-6">
        <div className="flex justify-between items-center mb-4 max-w-[90rem] mx-auto">
          <h1 className="text-3xl font-bold">OEE Reports</h1>
          <button
            onClick={exportToExcel}
            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition"
          >
            <Download className="w-5 h-5 mr-2 font-bold" />
            <span className="font-bold">Export</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4 max-w-[90rem] mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by station, shift, or date..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-600 p-4 rounded-lg flex items-center gap-2 mb-4 animate-pulse max-w-[90rem] mx-auto">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="text-gray-600 text-center py-4 max-w-[90rem] mx-auto">
            Loading OEE data...
          </div>
        )}

        {/* Bar Chart */}
        {!loading && !error && paginatedOEERecords.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-[90rem] mx-auto mb-6">
            <div className="relative h-80">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-[90rem] mx-auto overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse rounded-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-[#141E30] to-[#243B55] text-white uppercase text-sm tracking-wider">
                  <tr>
                    <th className="p-3 text-center">Station</th>
                    <th className="p-3 text-center">Shift</th>
                    <th className="p-3 text-center">Production Date</th>
                    <th className="p-3 text-center">Availability (%)</th>
                    <th className="p-3 text-center">Performance (%)</th>
                    <th className="p-3 text-center">Quality (%)</th>
                    <th className="p-3 text-center">OEE (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {paginatedOEERecords.map((record, index) => (
                    <tr
                      key={record.id}
                      className={`hover:bg-green-100 transition duration-200 ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <td className="p-3 text-center">{record.station}</td>
                      <td className="p-3 text-center">{record.shift}</td>
                      <td className="p-3 text-center">
                        {new Date(record.productionDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-center">
                        {record.totalOEE.availability.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        {record.totalOEE.performance.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        {record.totalOEE.quality.toFixed(2)}
                      </td>
                      <td className="p-3 text-center font-semibold">
                        {record.totalOEE.oee.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && !error && filteredOEERecords.length === 0 && (
          <div className="text-gray-600 text-center py-4 max-w-[90rem] mx-auto">
            No OEE data available.
          </div>
        )}
      </div>
    </div>
  );
}