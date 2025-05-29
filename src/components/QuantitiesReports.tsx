"use client";

import { useEffect, useState } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
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
  BarElement,
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

const stations = ["Internal Line", "External Line", "Final Line", "Valve Plate"];
const shifts = ["Morning", "Day", "Evening", "Night"];

export default function QuantitiesReports() {
  const [station, setStation] = useState<string>("Internal Line");
  const [shift, setShift] = useState<string>("Morning");
  const [date, setDate] = useState<string>("2025-05-19"); // Default to current date
  const [shiftHours, setShiftHours] = useState<string[]>([]);
  const [productRecords, setProductRecords] = useState<ProductRecord[]>([]);
  const [currentBatch, setCurrentBatch] = useState<string>("NA");
  const [hourlyProduction, setHourlyProduction] = useState<number[]>([]);
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
        setHourlyProduction([]);
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

      // Calculate hourly production
      const hourlyQty: { [key: string]: number } = {};
      hours.forEach((hour) => {
        hourlyQty[hour] = 0;
      });

      records.forEach((record) => {
        const start = parseTime(record.startTime);
        const end = parseTime(record.endTime);
        const qty = parseInt(record.qty, 10) || 0;

        if (!start || !end) return;

        const startHour = start.getHours();
        const endHour = end.getHours();
        const adjustedEndHour = endHour < startHour ? endHour + 24 : endHour;
        const hoursSpan = adjustedEndHour - startHour + 1;

        for (let hour = startHour; hour <= adjustedEndHour; hour++) {
          const displayHour = hour % 24;
          const hourLabel = `${displayHour.toString().padStart(2, "0")}:00`;
          if (hourlyQty[hourLabel] !== undefined) {
            const qtyPerHour = qty / hoursSpan;
            hourlyQty[hourLabel] += qtyPerHour;
          }
        }
      });

      const productionData = hours.map((hour) => Math.round(hourlyQty[hour] || 0));
      setHourlyProduction(productionData);
      setError(null);
    } catch (error) {
      console.error("Error fetching product records:", error);
      setError("Failed to fetch product records. Check server status.");
      setShiftHours(["No Data"]);
      setHourlyProduction([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchProductRecords();
  }, [station, shift, date]);

  // Calculate target quantities (e.g., based on shift duration, assuming 8-hour shift with 100 units/hour target)
  const targetQuantities = shiftHours.map(() => {
    // Assuming an 8-hour shift with 100 units/hour target
    return 800; // Adjust based on actual target data or shift length
  });

  // Chart data for bar chart
  const chartData: ChartData<"bar", number[], string> = {
    labels: shiftHours,
    datasets: [
      {
        label: "Target Quantity",
        data: targetQuantities,
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Production Quantity",
        data: hourlyProduction,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
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
          label: (context: TooltipItem<"bar">) =>
            `${context.dataset.label}: ${context.raw}`,
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
        title: {
          display: true,
          text: "Quantity",
          color: "#ffffff",
        },
        ticks: {
          color: "#ffffff",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
  };

  return (
    <div className="p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-700 m-4">
      <h1 className="text-2xl font-semibold text-gray-200 mb-4">Quantities Reports</h1>

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
        <div className="text-gray-400 text-center py-4">Loading quantities data...</div>
      )}

      {/* Bar Chart */}
      {!loading && !error && shiftHours.length > 0 && shiftHours[0] !== "No Data" && (
        <div className="relative h-80">
          <Chart type="bar" data={chartData} options={chartOptions} />
        </div>
      )}

      {!loading && !error && (shiftHours.length === 0 || shiftHours[0] === "No Data") && (
        <div className="text-gray-400 text-center py-4">No quantities data available.</div>
      )}
    </div>
  );
}