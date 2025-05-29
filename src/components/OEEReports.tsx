"use client";

import { useEffect, useState } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  ChartData,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface ProductRecord {
  id: number;
  productName: string;
  productCode: string;
  productGroup: string;
  station: string;
  productionDate: string;
  shift: string;
  cycleTime: string;
  unitsPerSensorSignal: string;
  startTime: string;
  endTime: string;
  qty: string;
  is_active: number;
  creator: string | null;
  sys_date_time: string;
  updated_at: string | null;
}

interface DowntimeRecord {
  startTime: string;
  endTime: string;
  problemGroup: string;
  problemReason: string;
  problem_name: string;
  location: string;
  planned_status: "planned" | "unplanned";
}

const stations = ["Internal Line", "External Line", "Final Line", "Valve Plate"];
const shifts = ["Morning", "Day", "Evening", "Night"];

export default function OEEReports() {
  const [station, setStation] = useState<string>("Internal Line");
  const [shift, setShift] = useState<string>("Morning");
  const [date, setDate] = useState<string>("2025-05-19"); // Default to current date
  const [shiftHours, setShiftHours] = useState<string[]>([]);
  const [productRecords, setProductRecords] = useState<ProductRecord[]>([]);
  const [downtimeRecords, setDowntimeRecords] = useState<DowntimeRecord[]>([]);
  const [currentBatch, setCurrentBatch] = useState<string>("NA");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Parse time string (e.g., "10:00:00" or "10:00") to Date
  const parseTime = (time: string): Date | null => {
    try {
      const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
      if (!timeRegex.test(time)) {
        console.warn(`Invalid time format: ${time}`);
        return null;
      }
      const normalizedTime = time.split(":").length === 2 ? `${time}:00` : time;
      const date = new Date(`1970-01-01T${normalizedTime}`);
      if (isNaN(date.getTime())) {
        console.warn(`Failed to parse time: ${normalizedTime}`);
        return null;
      }
      return date;
    } catch (error) {
      console.error(`Error parsing time: ${time}`, error);
      return null;
    }
  };

  // Generate shift hours based on earliest startTime and latest endTime
  const generateShiftHours = (records: ProductRecord[]): string[] => {
    if (!records || records.length === 0) {
      return [];
    }

    let earliestStart: Date | null = null;
    let latestEnd: Date | null = null;

    for (const record of records) {
      const start = parseTime(record.startTime);
      const end = parseTime(record.endTime);

      if (!start || !end) {
        continue;
      }

      if (!earliestStart || start < earliestStart) {
        earliestStart = start;
      }
      if (!latestEnd || end > latestEnd) {
        latestEnd = end;
      }
    }

    if (!earliestStart || !latestEnd) {
      return [];
    }

    const hours: string[] = [];
    let startHours = earliestStart.getHours();
    let endHours = latestEnd.getHours();

    if (endHours < startHours) {
      endHours += 24;
    }

    for (let hour = startHours; hour <= endHours; hour++) {
      const displayHour = hour % 24;
      hours.push(`${displayHour.toString().padStart(2, "0")}:00`);
    }

    return hours;
  };

  // Fetch product records and infer shift timings
  const fetchProductRecords = async () => {
    try {
      const shiftName = shift;
      if (!station || !shiftName) {
        setCurrentBatch("NA");
        setError("Station or shift not selected");
        setShiftHours([]);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/products/getSpecificProductReport?station=${encodeURIComponent(station)}&shift=${shiftName}&date=${date}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data: ProductRecord[] = await response.json();

      const records: ProductRecord[] = Array.isArray(data)
        ? data.map((item) => ({
            id: item.id ?? 0,
            productName: item.productName ?? "",
            productCode: item.productCode ?? "",
            productGroup: item.productGroup ?? "",
            station: item.station ?? "",
            productionDate: item.productionDate ?? "",
            shift: item.shift ?? "",
            cycleTime: item.cycleTime ?? "",
            unitsPerSensorSignal: item.unitsPerSensorSignal ?? "",
            startTime: item.startTime ?? "",
            endTime: item.endTime ?? "",
            qty: item.qty ?? "0",
            is_active: item.is_active ?? 0,
            creator: item.creator ?? null,
            sys_date_time: item.sys_date_time ?? "",
            updated_at: item.updated_at ?? null,
          }))
        : [];

      const hours = generateShiftHours(records);
      setShiftHours(hours.length > 0 ? hours : ["No Data"]);
      setProductRecords(records);

      const currentTime = new Date("2025-05-19T16:58:00+06:00"); // Updated to current time: May 19, 2025, 04:58 PM +06
      let foundBatch = "NA";

      for (const record of records) {
        try {
          if (!record.startTime || !record.endTime) {
            console.warn(`Missing startTime or endTime for record ID ${record.id}:`, record);
            continue;
          }

          const start = parseTime(record.startTime);
          const end = parseTime(record.endTime);

          if (!start || !end) {
            console.warn(`Invalid time format for record ID ${record.id}:`, record);
            continue;
          }

          const currentHours = currentTime.getHours();
          const currentMinutes = currentTime.getMinutes();
          const startHours = start.getHours();
          const startMinutes = start.getMinutes();
          const endHours = end.getHours();
          const endMinutes = end.getMinutes();

          let currentTotalMinutes = currentHours * 60 + currentMinutes;
          let startTotalMinutes = startHours * 60 + startMinutes;
          let endTotalMinutes = endHours * 60 + endMinutes;

          if (endTotalMinutes < startTotalMinutes) {
            endTotalMinutes += 24 * 60;
            if (currentTotalMinutes < startTotalMinutes) {
              currentTotalMinutes += 24 * 60;
            }
          }

          if (
            currentTotalMinutes >= startTotalMinutes &&
            currentTotalMinutes <= endTotalMinutes
          ) {
            foundBatch = record.productName;
            break;
          }
        } catch (error) {
          console.error(`Error processing record ID ${record.id}:`, record, error);
        }
      }

      setCurrentBatch(foundBatch);
      setError(null);
    } catch (error) {
      console.error("Error fetching product records:", error);
      setError("Failed to fetch product records. Check server status.");
      setShiftHours(["No Data"]);
    }
  };

  // Fetch downtime records
  const fetchDowntimeRecords = async () => {
    try {
      if (!station || !shift || !date) return;
      const response = await fetch(
        `http://localhost:5000/api/downtimeProblem/getSpecificDowntimeRecordsByDate?station=${station}&shift=${shift}&date=${date}`
      );
      if (!response.ok) throw new Error("Failed to fetch downtime records");
      const data = await response.json();

      const records = Array.isArray(data)
        ? data.map((item: any) => ({
            startTime: item.startTime || "",
            endTime: item.endTime || "",
            problemGroup: item.problemGroup || "",
            problemReason: item.problemReason || "",
            problem_name: item.problem_name || "",
            location: item.location || "",
            planned_status: item.planned_status || "unplanned",
          }))
        : [];

      setDowntimeRecords(records);
      setError(null);
    } catch (error) {
      console.error("Error fetching downtime records:", error);
      setError("Failed to fetch downtime records. Check server status.");
    }
  };

  // Calculate hourly OEE metrics
  const calculateHourlyOEE = () => {
    const labels = shiftHours;
    const availabilityData = Array(labels.length).fill(100); // Default to 100%
    const performanceData = Array(labels.length).fill(0);
    const qualityData = Array(labels.length).fill(100); // Assume 100% quality unless defective units are tracked
    const oeeData = Array(labels.length).fill(0);

    // Calculate downtime impact on availability
    downtimeRecords.forEach((record) => {
      if (record.startTime && record.endTime) {
        const start = parseTime(record.startTime);
        const end = parseTime(record.endTime);

        if (!start || !end) {
          console.warn(`Invalid downtime record times:`, record);
          return;
        }

        const startHour = start.getHours();
        const endHour = end.getHours();
        const adjustedEndHour = endHour < startHour ? endHour + 24 : endHour;

        for (let hour = startHour; hour <= adjustedEndHour; hour++) {
          const displayHour = hour % 24;
          const hourLabel = `${displayHour.toString().padStart(2, "0")}:00`;
          const index = labels.indexOf(hourLabel);

          if (index !== -1) {
            // Reduce availability by downtime duration (simplified as 10% per hour of downtime)
            availabilityData[index] = Math.max(0, availabilityData[index] - 10);
          }
        }
      }
    });

    // Calculate performance and OEE for each hour
    productRecords.forEach((record) => {
      const start = parseTime(record.startTime);
      const end = parseTime(record.endTime);
      const qty = parseInt(record.qty, 10) || 0;
      const cycleTime = parseFloat(record.cycleTime) || 1; // Default to 1 second if invalid

      if (!start || !end) return;

      const startHour = start.getHours();
      const endHour = end.getHours();
      const adjustedEndHour = endHour < startHour ? endHour + 24 : endHour;
      const hoursSpan = adjustedEndHour - startHour + 1;
      const idealOutput = (3600 / cycleTime) * hoursSpan; // Ideal output in units per hour * hours

      for (let hour = startHour; hour <= adjustedEndHour; hour++) {
        const displayHour = hour % 24;
        const hourLabel = `${displayHour.toString().padStart(2, "0")}:00`;
        const index = labels.indexOf(hourLabel);

        if (index !== -1) {
          const qtyPerHour = qty / hoursSpan;
          performanceData[index] = (qtyPerHour / idealOutput) * 100 || 0;
          oeeData[index] = (availabilityData[index] * performanceData[index] * qualityData[index]) / 10000 || 0;
        }
      }
    });

    return { availabilityData, performanceData, qualityData, oeeData };
  };

  // Fetch data when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchProductRecords(), fetchDowntimeRecords()]);
      setLoading(false);
    };
    fetchData();
  }, [station, shift, date]);

  // Calculate OEE metrics
  const { availabilityData, performanceData, qualityData, oeeData } = calculateHourlyOEE();

  // Chart data for line chart
  const chartData: ChartData<"line", number[], string> = {
    labels: shiftHours,
    datasets: [
      {
        label: "OEE",
        data: oeeData,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Performance",
        data: performanceData,
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        borderWidth: 2,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Availability",
        data: availabilityData,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderWidth: 2,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Quality",
        data: qualityData,
        borderColor: "rgba(0, 128, 0, 1)",
        backgroundColor: "rgba(0, 128, 0, 0.2)",
        borderWidth: 2,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#ffffff",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"line">) =>
            `${context.dataset.label}: ${(context.raw as number).toFixed(2)}%`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Shift Hour",
          color: "#ffffff",
        },
        ticks: {
          color: "#ffffff",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Percentage (%)",
          color: "#ffffff",
        },
        ticks: {
          color: "#ffffff",
          callback: (tickValue: string | number): string => {
            if (typeof tickValue === "number") {
              return `${tickValue}%`;
            }
            return String(tickValue);
          },
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
  };

  return (
    <div className="p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-700 m-4">
      <h1 className="text-2xl font-semibold text-gray-200 mb-4">OEE Reports</h1>

      {/* Select Fields */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label htmlFor="station" className="block text-gray-400 mb-1">
            Select Station
          </label>
          <select
            id="station"
            value={station}
            onChange={(e) => setStation(e.target.value)}
            className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {stations.map((stationOption) => (
              <option key={stationOption} value={stationOption}>
                {stationOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="shift" className="block text-gray-400 mb-1">
            Select Shift
          </label>
          <select
            id="shift"
            value={shift}
            onChange={(e) => setShift(e.target.value)}
            className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {shifts.map((shiftOption) => (
              <option key={shiftOption} value={shiftOption}>
                {shiftOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-gray-400 mb-1">
            Select Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg flex items-center gap-2 mb-4 animate-pulse">
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
        <div className="text-gray-400 text-center py-4">Loading OEE data...</div>
      )}

      {/* Line Chart */}
      {!loading && !error && shiftHours.length > 0 && shiftHours[0] !== "No Data" && (
        <div className="relative h-80">
          <Chart type="line" data={chartData} options={chartOptions} />
        </div>
      )}

      {!loading && !error && (shiftHours.length === 0 || shiftHours[0] === "No Data") && (
        <div className="text-gray-400 text-center py-4">No OEE data available.</div>
      )}
    </div>
  );
}