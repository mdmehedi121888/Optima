import { useState, useEffect } from "react";
import Swal from "sweetalert2";

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
        setRecords(data);
      } catch (error:any) {
        console.error("Error fetching downtime records:", error);
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

  return (
    <div className="overflow-x-auto">
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-4">No downtime records found.</div>
      ) : (
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
            {records.map((record, index) => (
              <tr
                key={record.id}
                className={`transition duration-200 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-green-100`}
              >
                <td className="p-3 font-semibold text-center">{record.productName}</td>
                <td className="p-3 text-center">{record.station}</td>
                <td className="p-3 text-center">{formatDate(record.productionDate)}</td>
                <td className="p-3 text-center">{record.shift}</td>
                <td className="p-3 text-center">{record.problem_name}</td>
                <td className="p-3 text-center">{record.startTime}</td>
                <td className="p-3 text-center">{record.endTime}</td>
                <td className="p-3 text-center">{calculateDuration(record.startTime, record.endTime)}</td>
                <td className="p-3 text-center">{record.location}</td>
                <td className="p-3 text-center">{record.planned_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}