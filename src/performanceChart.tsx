"use client";

import { useEffect, useState } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
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
  BarElement,
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

interface PerformanceChartProps {
  station: string;
  shift: string;
  productionQty: number;
  hourlyOEE: { hour: string; oee: number }[];
}

export function PerformanceChart({ station, shift, productionQty, hourlyOEE }: PerformanceChartProps) {
  const [currentBatch, setCurrentBatch] = useState<string>("NA");
  const [error, setError] = useState<string | null>(null);
  const [shiftHours, setShiftHours] = useState<string[]>([]);
  const [downtimeRecords, setDowntimeRecords] = useState<DowntimeRecord[]>([]);

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

  // Generate shift hours for x-axis based on earliest startTime and latest endTime
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
        `http://localhost:5000/api/products/specificProductRecords?station=${encodeURIComponent(station)}&shift=${shiftName}`,
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

      const currentTime = new Date("2025-05-19T15:45:00+06:00"); // Updated to current time: May 19, 2025, 03:45 PM +06
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
  useEffect(() => {
    const fetchDowntimeRecords = async () => {
      try {
        if (!station || !shift) return;
        const response = await fetch(
          `http://localhost:5000/api/downtimeProblem/specificDowntimeRecords?station=${station}&shift=${shift}`
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

    fetchDowntimeRecords();
  }, [station, shift]);

  useEffect(() => {
    fetchProductRecords();
    const interval = setInterval(fetchProductRecords, 60000);
    return () => clearInterval(interval);
  }, [station, shift]);

  // Calculate Availability based on downtime records
  const calculateAvailability = () => {
    const labels = hourlyOEE.length > 0 ? hourlyOEE.map((entry) => entry.hour) : shiftHours;
    const availabilityData = Array(labels.length).fill(100); // Default to 100%

    downtimeRecords.forEach((record) => {
      if (record.startTime && record.endTime) {
        try {
          const start = parseTime(record.startTime);
          const end = parseTime(record.endTime);

          if (!start || !end) {
            console.warn(`Invalid downtime record times:`, record);
            return;
          }

          const startHour = start.getHours();
          const endHour = end.getHours();

          // Handle overnight shifts
          const adjustedEndHour = endHour < startHour ? endHour + 24 : endHour;

          // Iterate through each hour affected by the downtime
          for (let hour = startHour; hour <= adjustedEndHour; hour++) {
            const displayHour = hour % 24;
            const hourLabel = `${displayHour.toString().padStart(2, "0")}:00`;
            const index = labels.indexOf(hourLabel);

            if (index !== -1) {
              // Reduce availability by 10% per downtime event in that hour
              availabilityData[index] = Math.max(0, availabilityData[index] - 10);
            }
          }
        } catch (error) {
          console.error(`Error processing downtime record:`, record, error);
        }
      }
    });

    return availabilityData;
  };

  const availabilityData = calculateAvailability();

  // Calculate Performance data
  const performanceData = hourlyOEE.length > 0
    ? hourlyOEE.map((entry, index) => {
        const availability = availabilityData[index] / 100; // Convert to decimal
        return availability > 0 ? (entry.oee / availability) : 0; // Performance = OEE / Availability
      })
    : shiftHours.map(() => 0);

  // Calculate total values (averages)
  const totalOEE =
    hourlyOEE.length > 0
      ? hourlyOEE.reduce((sum, entry) => sum + entry.oee, 0) / hourlyOEE.length
      : 0;
  const totalPerformance =
    performanceData.length > 0
      ? performanceData.reduce((sum, value) => sum + value, 0) / performanceData.length
      : 0;
  const totalAvailability =
    availabilityData.length > 0
      ? availabilityData.reduce((sum, value) => sum + value, 0) / availabilityData.length
      : 0;
  const totalQuality = 100; // Quality is always 100%

  // Chart data with bar and line datasets
  const chartData: ChartData<"bar" | "line", number[], string> = {
    labels: hourlyOEE.length > 0 ? hourlyOEE.map((entry) => entry.hour) : shiftHours,
    datasets: [
      {
        label: "OEE",
        type: "bar" as const,
        data: hourlyOEE.length > 0 ? hourlyOEE.map((entry) => entry.oee) : shiftHours.map(() => 0),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        yAxisID: "y",
      },
      {
        label: "Performance",
        type: "line" as const,
        data: performanceData,
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        borderWidth: 2,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y",
      },
      {
        label: "Availability",
        type: "line" as const,
        data: availabilityData,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderWidth: 2,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y",
      },
      {
        label: "Quality",
        type: "line" as const,
        data: hourlyOEE.length > 0 ? hourlyOEE.map(() => 100) : shiftHours.map(() => 100),
        borderColor: "rgba(0, 128, 0, 1)",
        backgroundColor: "rgba(0, 128, 0, 0.2)",
        borderWidth: 2,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y",
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
          generateLabels: (chart: any) => {
            const datasets: any = chart.data.datasets;
            return datasets.map((dataset: any, index: number) => ({
              text: `${dataset.label} ${index === 0 ? totalOEE.toFixed(2) : index === 1 ? totalPerformance.toFixed(2) : index === 2 ? totalAvailability.toFixed(2) : totalQuality.toFixed(2)}%`,
              fillStyle: dataset.backgroundColor as string,
              strokeStyle: dataset.borderColor as string,
              lineWidth: dataset.borderWidth as number,
              hidden: !chart.isDatasetVisible(index),
              datasetIndex: index,
              color: "#ffffff", // For Chart.js v4+
              fontColor: "#ffffff", // For Chart.js v3.x compatibility
            }));
          },
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"bar" | "line">) =>
            `${context.dataset.label} ${context.raw as number > 0 ? (context.raw as number).toFixed(2) : 0}%`,
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
          callback: (
            tickValue: string | number,
            index: number,
            ticks: any[]
          ): string => {
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
    <div className="p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-700">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-lg text-gray-400">OEE for {currentBatch}</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-gray-400 font-semibold uppercase tracking-wider">
            OEE
            <div className="h-0.5 w-7 bg-green-500 rounded-full mt-1" />
          </span>
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

      {/* Chart Section */}
      <div className="relative h-80">
        <Chart type="bar" data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}