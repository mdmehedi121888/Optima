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

interface HourlyOEE {
  hour: string;
  targetPerHour: number;
  achievedQtyPerHour: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

interface OEEMetricsResponse {
  message: string;
  data: {
    hourlyOEE: HourlyOEE[];
    totalOEE: {
      shift: string;
      totalPlannedMinutes: number;
      totalRunningMinutes: number;
      totalDowntimeMinutes: number;
      totalAchievedQty: number;
      totalTargetQty: number;
      totalGoodQty: number;
      availability: number;
      performance: number;
      quality: number;
      oee: number;
    };
  };
}

interface PerformanceChartProps {
  station: string;
  shift: string;
}

export function PerformanceChart({ station, shift }: PerformanceChartProps) {
  const [hourlyOEE, setHourlyOEE] = useState<HourlyOEE[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalOEE, setTotalOEE] = useState<number>(0);
  const [totalAvailability, setTotalAvailability] = useState<number>(0);
  const [totalPerformance, setTotalPerformance] = useState<number>(0);
  const [totalQuality, setTotalQuality] = useState<number>(0);

  // Fetch OEE metrics from API
  useEffect(() => {
    const fetchOEEMetrics = async () => {
      try {
        if (!station || !shift) {
          setError("Station or shift not selected");
          setHourlyOEE([]);
          return;
        }

        const productionDate = new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD format
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/oee-metrics/get/by-date?station=${encodeURIComponent(station)}&productionDate=${productionDate}&shift=${shift}`,
          { credentials: "include" }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data: OEEMetricsResponse = await response.json();
        const hourlyOEEData = data.data.hourlyOEE;

        if (!Array.isArray(hourlyOEEData)) {
          throw new Error("Invalid hourlyOEE data format");
        }

        setHourlyOEE(hourlyOEEData);
        setError(null);

        // Use totalOEE values from API response
        const totalOEEData = data.data.totalOEE;
        setTotalOEE(totalOEEData.oee || 0);
        setTotalAvailability(totalOEEData.availability || 0);
        setTotalPerformance(totalOEEData.performance || 0);
        setTotalQuality(totalOEEData.quality || 0);
      } catch (error) {
        console.error("Error fetching OEE metrics:", error);
        setError("Failed to fetch OEE metrics. Check server status.");
        setHourlyOEE([]);
      }
    };

    fetchOEEMetrics();
    const interval = setInterval(fetchOEEMetrics, 15000); // Refresh in 15 seconds
    return () => clearInterval(interval);
  }, [station, shift]);

  // Chart data
  const chartData: ChartData<"bar" | "line", number[], string> = {
    labels: hourlyOEE.length > 0 ? hourlyOEE.map((entry) => entry.hour.split(" - ")[0]) : ["No Data"],
    datasets: [
      {
        label: "OEE",
        type: "bar" as const,
        data: hourlyOEE.length > 0 ? hourlyOEE.map((entry) => entry.oee) : [0],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        yAxisID: "y",
      },
      {
        label: "Performance",
        type: "line" as const,
        data: hourlyOEE.length > 0 ? hourlyOEE.map((entry) => entry.performance) : [0],
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
        data: hourlyOEE.length > 0 ? hourlyOEE.map((entry) => entry.availability) : [0],
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
        data: hourlyOEE.length > 0 ? hourlyOEE.map((entry) => entry.quality) : [0],
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
          generateLabels: (chart: ChartJS) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, index) => ({
              text: `${dataset.label} ${
                index === 0
                  ? totalOEE.toFixed(2)
                  : index === 1
                  ? totalPerformance.toFixed(2)
                  : index === 2
                  ? totalAvailability.toFixed(2)
                  : totalQuality.toFixed(2)
              }%`,
              fillStyle: dataset.backgroundColor as string,
              strokeStyle: dataset.borderColor as string,
              lineWidth: dataset.borderWidth as number,
              hidden: !chart.isDatasetVisible(index),
              datasetIndex: index,
              color: "#ffffff",
              fontColor: "#ffffff",
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
        min: 0,
        title: {
          display: true,
          text: "Percentage (%)",
          color: "#ffffff",
        },
        ticks: {
          color: "#ffffff",
          callback: (tickValue: string | number): string => `${tickValue}%`,
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
          <span className="text-lg text-gray-15">OEE for {station}</span>
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