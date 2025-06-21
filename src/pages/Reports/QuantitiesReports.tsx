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
  totalOEE: {
    shift: string;
    totalTargetQty: number;
    totalAchievedQty: number;
    totalGoodQty: number;
    totalScrapQty: number;
  };
}

export default function QuantitiesReports() {
  const [records, setRecords] = useState<OEERecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 7;

  // Fetch records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/oee-metrics/getAll", {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const { data } = await response.json();
      setRecords(data || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching records:", error);
      setError("Failed to fetch quantity records. Check server status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Filter and paginate records
  const filteredRecords = records
    .filter(
      (record) =>
        record.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.shift.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(record.productionDate).toLocaleDateString().includes(searchTerm)
    )
    .sort((a, b) => new Date(b.productionDate).getTime() - new Date(a.productionDate).getTime());

  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // Prepare data for bar chart
  const getCurrentPageRecordsData = () => {
    const labels: string[] = paginatedRecords.map((record) =>
      `${new Date(record.productionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}- ${record.station} (${record.shift})`
    );
    const targetQtyData: number[] = paginatedRecords.map((record) => record.totalOEE.totalTargetQty);
    const achievedQtyData: number[] = paginatedRecords.map((record) => record.totalOEE.totalAchievedQty);
    const goodQtyData: number[] = paginatedRecords.map((record) => record.totalOEE.totalGoodQty);
    const scrapQtyData: number[] = paginatedRecords.map((record) => record.totalOEE.totalScrapQty);

    return { labels, targetQtyData, achievedQtyData, goodQtyData, scrapQtyData };
  };

  // Bar chart data
  const { labels, targetQtyData, achievedQtyData, goodQtyData, scrapQtyData } = getCurrentPageRecordsData();
  const chartData: ChartData<"bar", number[], string> = {
    labels,
    datasets: [
      {
        label: "Target Quantity",
        data: targetQtyData,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "Achieved Quantity",
        data: achievedQtyData,
        backgroundColor: "rgba(255, 206, 86, 0.6)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      },
      {
        label: "Good Quantity",
        data: goodQtyData,
        backgroundColor: "rgba(0, 128, 0, 0.6)",
        borderColor: "rgba(0, 128, 0, 1)",
        borderWidth: 1,
      },
      {
        label: "Scrap Quantity",
        data: scrapQtyData,
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
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
          label: (context: TooltipItem<"bar">) => `${context.dataset.label}: ${context.raw}`,
        },
      },
      title: {
        display: true,
        text: "Quantity Metrics for Current Page Records",
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
        title: {
          display: true,
          text: "Quantity",
          color: "#333",
        },
        ticks: {
          color: "#333",
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
      const exportData = filteredRecords.map((record) => ({
        Station: record.station,
        Shift: record.shift,
        "Production Date": new Date(record.productionDate).toLocaleDateString(),
        "Target Quantity": record.totalOEE.totalTargetQty,
        "Achieved Quantity": record.totalOEE.totalAchievedQty,
        "Good Quantity": record.totalOEE.totalGoodQty,
        "Scrap Quantity": record.totalOEE.totalScrapQty,
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      worksheet["!cols"] = [
        { wch: 15 }, // Station
        { wch: 10 }, // Shift
        { wch: 15 }, // Production Date
        { wch: 15 }, // Target Quantity
        { wch: 15 }, // Achieved Quantity
        { wch: 15 }, // Good Quantity
        { wch: 15 }, // Scrap Quantity
      ];

      // Create workbook and append worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Quantities Report");

      // Generate and download Excel file
      XLSX.writeFile(workbook, "Quantities_Report.xlsx");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("Failed to export quantity data to Excel.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-full p-6">
        <div className="flex justify-between items-center mb-4 max-w-[90rem] mx-auto">
          <h1 className="text-3xl font-bold">Quantities Reports</h1>
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
            Loading quantities data...
          </div>
        )}

        {/* Bar Chart */}
        {!loading && !error && paginatedRecords.length > 0 && (
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
                    <th className="p-3 text-center">Target Quantity</th>
                    <th className="p-3 text-center">Achieved Quantity</th>
                    <th className="p-3 text-center">Good Quantity</th>
                    <th className="p-3 text-center">Scrap Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {paginatedRecords.map((record, index) => (
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
                      <td className="p-3 text-center">{record.totalOEE.totalTargetQty}</td>
                      <td className="p-3 text-center">{record.totalOEE.totalAchievedQty}</td>
                      <td className="p-3 text-center">{record.totalOEE.totalGoodQty}</td>
                      <td className="p-3 text-center font-semibold">{record.totalOEE.totalScrapQty}</td>
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

        {!loading && !error && filteredRecords.length === 0 && (
          <div className="text-gray-600 text-center py-4 max-w-[90rem] mx-auto">
            No quantities data available.
          </div>
        )}
      </div>
    </div>
  );
}