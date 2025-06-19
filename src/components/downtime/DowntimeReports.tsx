"use client";

import { useState, useEffect } from "react";
import { Search, Download } from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

interface DowntimeRecord {
  id: number;
  productName: string;
  productCode: string;
  productGroup: string;
  station: string;
  productionDate: string;
  shift: string;
  cycleTime: string;
  unitsPerSensorSignal: string;
  problem_name: string;
  startTime: string;
  endTime: string;
  location: string;
  planned_status: string;
  is_active: number;
  creator: string | null;
  sys_date_time: string;
  updated_at: string | null;
}

export default function DowntimeReports() {
  const [records, setRecords] = useState<DowntimeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDowntimeRecords = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/downtimeProblem/getAllDowntimeRecords", {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch downtime records: ${response.statusText}`);
        }
        const data = await response.json();
        setRecords(data || []);
        setError(null);
      } catch (error: any) {
        console.error("Error fetching downtime records:", error);
        setError(error.message || "Failed to load downtime records. Please try again.");
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Failed to load downtime records",
          text: error.message || "Please try again.",
          showConfirmButton: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDowntimeRecords();
  }, []);

  // Calculate duration between startTime and endTime in minutes
  const calculateDuration = (startTime: string, endTime: string): string => {
    try {
      const start = new Date(`1970-01-01T${startTime}Z`);
      const end = new Date(`1970-01-01T${endTime}Z`);
      const diffMs = end.getTime() - start.getTime();
      const minutes = Math.round(diffMs / 60000);
      return `${minutes} min`;
    } catch (error) {
      console.error("Error calculating duration:", error);
      return "N/A";
    }
  };

  // Format production date
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateStr;
    }
  };

  // Filter and paginate records
  const filteredRecords = records.filter(
    (record) =>
      record.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.shift.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.problem_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.planned_status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(record.productionDate).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // Export to Excel
  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const exportData = filteredRecords.map((record) => ({
        "Product Name": record.productName,
        Station: record.station,
        "Production Date": formatDate(record.productionDate),
        Shift: record.shift,
        "Problem Name": record.problem_name,
        "Start Time": record.startTime,
        "End Time": record.endTime,
        Duration: calculateDuration(record.startTime, record.endTime),
        Location: record.location,
        "Planned Status": record.planned_status,
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      worksheet["!cols"] = [
        { wch: 20 }, // Product Name
        { wch: 15 }, // Station
        { wch: 20 }, // Production Date
        { wch: 10 }, // Shift
        { wch: 20 }, // Problem Name
        { wch: 12 }, // Start Time
        { wch: 12 }, // End Time
        { wch: 10 }, // Duration
        { wch: 15 }, // Location
        { wch: 15 }, // Planned Status
      ];

      // Create workbook and append worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Downtime Report");

      // Generate and download Excel file
      XLSX.writeFile(workbook, "Downtime_Report.xlsx");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("Failed to export downtime data to Excel.");
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Failed to export downtime data",
        text: "Please try again.",
        showConfirmButton: true,
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-full p-6">
        <div className="flex justify-between items-center mb-4 max-w-[90rem] mx-auto">
          <h1 className="text-3xl font-bold">Downtime Reports</h1>
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
              placeholder="Search by product, station, shift, problem, location, or date..."
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
          <div className="bg-red-500/10 border border-red-500 text-red-600 p-4 rounded-lg flex items-center gap-2 mb-4 animate-pulse max-w-[90rem]  mx-auto">
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
            Loading downtime data...
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-white p-6 rounded-xl shadow-lg w-full mx-auto overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse rounded-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-[#141E30] to-[#243B55] text-white uppercase text-sm tracking-wider">
                  <tr>
                    <th className="p-3 text-center">Product Name</th>
                    <th className="p-3 text-center">Station</th>
                    <th className="p-3 text-center">Production Date</th>
                    <th className="p-3 text-center">Shift</th>
                    <th className="p-3 text-center">Problem Name</th>
                    <th className="p-3 text-center">Start Time</th>
                    <th className="p-3 text-center">End Time</th>
                    <th className="p-3 text-center">Duration</th>
                    <th className="p-3 text-center">Location</th>
                    <th className="p-3 text-center">Planned Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {paginatedRecords.map((record, index) => (
                    <tr
                      key={record.id}
                      className={`transition duration-200 ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-green-100`}
                    >
                      <td className="p-3 font-semibold text-center">{record.productName}</td>
                      <td className="p-3 text-center">{record.station}</td>
                      <td className="p-3 text-center">{formatDate(record.productionDate)}</td>
                      <td className="p-3 text-center">{record.shift}</td>
                      <td className="p-3 text-center bg-pink-400 text-white">{record.problem_name}</td>
                      <td className="p-3 text-center">{record.startTime}</td>
                      <td className="p-3 text-center">{record.endTime}</td>
                      <td className="p-3 text-center bg-purple-400 text-white">
                        {calculateDuration(record.startTime, record.endTime)}
                      </td>
                      <td className="p-3 text-center">{record.location}</td>
                      <td
                        className={`p-3 text-center text-white ${
                          record.planned_status === "planned" ? "bg-green-700" : "bg-red-700"
                        } rounded`}
                      >
                        {record.planned_status}
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

        {!loading && !error && filteredRecords.length === 0 && (
          <div className="text-gray-600 text-center py-4 max-w-[90rem] mx-auto">
            No downtime data available.
          </div>
        )}
      </div>
    </div>
  );
}