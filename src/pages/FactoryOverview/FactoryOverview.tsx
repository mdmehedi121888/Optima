"use client";

import { useEffect, useState } from "react";
import { availableStations } from "../../components/common/lib/fetchStations";

interface OEEMetricsResponse {
  message: string;
  data: {
    hourlyOEE: {
      hour: string;
      targetPerHour: number;
      achievedQtyPerHour: number;
      plannedDowntime: number;
      unplannedDowntime: number;
      availability: number;
      performance: number;
      quality: number;
      oee: number;
    }[];
    totalOEE: {
      shift: string;
      totalPlannedMinutes: number;
      totalRunningMinutes: number;
      totalPlannedDowntimeMinutes: number;
      totalUnplannedDowntimeMinutes: number;
      totalAchievedQty: number;
      totalTargetQty: number;
      totalGoodQty: number;
      totalScrapQty: number;
      availability: number;
      performance: number;
      quality: number;
      oee: number;
    };
  };
}

interface StationMetrics {
  station: string;
  oee: number;
  totalTargetQty: number;
  totalAchievedQty: number;
}

export default function FactoryOverview() {
  const [metrics, setMetrics] = useState<StationMetrics[]>([]);
  const [previousMetrics, setPreviousMetrics] = useState<StationMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);


  // Fetch OEE metrics for each station
  const fetchOEEMetrics = async () => {
    try {
      const productionDate = new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD format
      const metricsData: StationMetrics[] = [];

      for (const station of availableStations) {
        const response = await fetch(
          `http://localhost:5000/api/oee-metrics/get/by-date?station=${encodeURIComponent(station)}&productionDate=${productionDate}&shift=Day`,
          { credentials: "include" }
        );
        if (!response.ok) {
          console.warn(`Failed to fetch OEE metrics for ${station}: ${response.status}`);
          metricsData.push({
            station: station,
            oee: 0,
            totalTargetQty: 0,
            totalAchievedQty: 0,
          });
          continue;
        }
        const data: OEEMetricsResponse = await response.json();
        metricsData.push({
          station: station,
          oee: data.data.totalOEE.oee || 0,
          totalTargetQty: data.data.totalOEE.totalTargetQty || 0,
          totalAchievedQty: data.data.totalOEE.totalAchievedQty || 0,
        });
      }

      // Store current metrics as previous before updating
      setPreviousMetrics(metrics);
      setMetrics(metricsData);
      setError(null);
    } catch (error) {
      console.error("Error fetching OEE metrics:", error);
      setError("Failed to fetch OEE metrics. Check server status.");
    }
  };

  useEffect(() => {
    if (availableStations.length > 0) {
      fetchOEEMetrics(); // Initial fetch
      const interval = setInterval(fetchOEEMetrics, 15000); // Fetch every 15 seconds
      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [availableStations]);

  // Determine card background color and status
  const getCardBackground = (metric: StationMetrics) => {
    if (metric.totalTargetQty === 0 && metric.totalAchievedQty === 0) {
      return { className: "bg-black", status: "shiftOff" };
    }
    const prevMetric = previousMetrics.find((m) => m.station === metric.station);
    if (!prevMetric) {
      return { className: "bg-gray-700", status: "stopped" }; // Default to stopped for first fetch
    }
    if (metric.totalAchievedQty !== prevMetric.totalAchievedQty) {
      return { className: "bg-green-700", status: "running" };
    }
    return { className: "bg-red-700", status: "stopped" };
  };

  // Calculate summary metrics
  const totalStations = availableStations.length;
  const runningStations = metrics.filter((metric) => {
    if (metric.totalTargetQty === 0 && metric.totalAchievedQty === 0) return false;
    const prevMetric = previousMetrics.find((m) => m.station === metric.station);
    return prevMetric && metric.totalAchievedQty !== prevMetric.totalAchievedQty;
  }).length;
  const stoppedStations = metrics.filter((metric) => {
    if (metric.totalTargetQty === 0 && metric.totalAchievedQty === 0) return false;
    const prevMetric = previousMetrics.find((m) => m.station === metric.station);
    return !prevMetric || metric.totalAchievedQty === prevMetric.totalAchievedQty;
  }).length;
  const shiftOffStations = metrics.filter(
    (metric) => metric.totalTargetQty === 0 && metric.totalAchievedQty === 0
  ).length;

  // Group stations by status
  const runningMetrics = metrics.filter((metric) => getCardBackground(metric).status === "running");
  const stoppedMetrics = metrics.filter((metric) => getCardBackground(metric).status === "stopped");
  const shiftOffMetrics = metrics.filter((metric) => getCardBackground(metric).status === "shiftOff");

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 p-8">
      <div className="flex-1 max-w-7xl mx-auto">

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-xl flex items-center gap-3 mb-8 animate-pulse">
            <svg
              className="w-6 h-6"
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
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Summary Card */}

        <div className="mb-8">
          <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-600 p-6 text-white">
            <div className="flex items-center justify-between gap-6 px-6">
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="col-span-2 mb-2">
                  <h2 className="text-lg font-bold text-green-400 tracking-wide">Station Overview</h2>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-4 rounded-xl shadow-md flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
                  <div>
                    <p className="text-sm text-gray-400">Total Stations</p>
                    <p className="text-lg font-bold text-white">{totalStations}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-4 rounded-xl shadow-md flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                  <div>
                    <p className="text-sm text-gray-400">Running</p>
                    <p className="text-lg font-bold text-white">{runningStations}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-4 rounded-xl shadow-md flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
                  <div>
                    <p className="text-sm text-gray-400">Stopped</p>
                    <p className="text-lg font-bold text-white">{stoppedStations}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-4 rounded-xl shadow-md flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></div>
                  <div>
                    <p className="text-sm text-gray-400">Shift Off</p>
                    <p className="text-lg font-bold text-white">{shiftOffStations}</p>
                  </div>
                </div>
              </div>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-40"></div>
                <div className="relative z-10 w-24 h-24 bg-gray-800 border-4 border-green-500 rounded-full flex items-center justify-center text-green-400 font-bold text-sm tracking-wider shadow-inner transition-all duration-1000 ease-in-out">
                  optimaX
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Running Stations Section */}

        {runningMetrics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
              Running Stations ({runningStations})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {runningMetrics.map((metric) => (
                <div
                  key={metric.station}
                  className={`rounded-2xl shadow-xl border border-gray-600 p-6 transition-transform hover:scale-[1.02] duration-300 ease-in-out ${getCardBackground(metric).className}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white tracking-wide">{metric.station}</h3>
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full uppercase font-semibold">
                      Running
                    </span>
                  </div>
                  <div className="space-y-3 text-sm font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">OEE</span>
                      <span
                        className={`${
                          metric.oee >= 85
                            ? "text-green-400"
                            : metric.oee >= 60
                            ? "text-yellow-400"
                            : "text-red-300"
                        }`}
                      >
                        {metric.oee.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Target Qty</span>
                      <span className="text-white">{metric.totalTargetQty} pcs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Achieved Qty</span>
                      <span className="text-white">{metric.totalAchievedQty} pcs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stopped Stations Section */}

        {stoppedMetrics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></span>
              Stopped Stations ({stoppedStations})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stoppedMetrics.map((metric) => (
                <div
                  key={metric.station}
                  className={`rounded-2xl shadow-xl border border-gray-600 p-6 transition-transform hover:scale-[1.02] duration-300 ease-in-out ${getCardBackground(metric).className}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white tracking-wide">{metric.station}</h3>
                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded uppercase font-semibold">
                      Stopped
                    </span>
                  </div>
                  <div className="space-y-3 text-sm font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">OEE</span>
                      <span
                        className={`${
                          metric.oee >= 85
                            ? "text-green-400"
                            : metric.oee >= 60
                            ? "text-yellow-400"
                            : "text-red-300"
                        }`}
                      >
                        {metric.oee.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Target Qty</span>
                      <span className="text-white">{metric.totalTargetQty} pcs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Achieved Qty</span>
                      <span className="text-white">{metric.totalAchievedQty} pcs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shift Off Stations Section */}

        {shiftOffMetrics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></span>
              Shift Off Stations ({shiftOffStations})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shiftOffMetrics.map((metric) => (
                <div
                  key={metric.station}
                  className={`rounded-2xl shadow-xl border border-gray-600 p-6 transition-transform hover:scale-[1.02] duration-300 ease-in-out ${getCardBackground(metric).className}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white tracking-wide">{metric.station}</h3>
                    <span className="text-xs bg-yellow-500 text-gray-900 px-2 py-1 rounded uppercase font-semibold">
                      Shift Off
                    </span>
                  </div>
                  <div className="space-y-3 text-sm font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">OEE</span>
                      <span
                        className={`${
                          metric.oee >= 85
                            ? "text-green-400"
                            : metric.oee >= 60
                            ? "text-yellow-400"
                            : "text-red-300"
                        }`}
                      >
                        {metric.oee.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Target Qty</span>
                      <span className="text-white">{metric.totalTargetQty} pcs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Achieved Qty</span>
                      <span className="text-white">{metric.totalAchievedQty} pcs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}