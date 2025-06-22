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

interface StationStatus {
  final_line_diff: number;
  internal_line_diff: number;
  external_line_diff: number;
  last_timestamp: string;
}

interface Shift {
  id: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  stations: string;
  days: string;
  is_active: number;
  creator: string | null;
  sys_date_time: string;
  updated_at: string | null;
}

export default function FactoryOverview() {
  const [metrics, setMetrics] = useState<StationMetrics[]>([]);
  const [stationStatuses, setStationStatuses] = useState<StationStatus[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch available shifts
  const fetchShifts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/shifts", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch shifts: ${response.status}`);
      }
      const data: Shift[] = await response.json();
      // Filter active shifts and check if current time is within shift time
      const currentTime = new Date();
      const currentDay = currentTime.toLocaleString("en-US", { weekday: "long" });
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTimeStr = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

      const activeShifts = data.filter((shift) => {
        if (shift.is_active !== 1) return false;
        if (!shift.days.includes(currentDay)) return false;

        const [startHour, startMinute] = shift.startTime.split(":").map(Number);
        const [endHour, endMinute] = shift.endTime.split(":").map(Number);
        const [currentHourParsed, currentMinuteParsed] = currentTimeStr.split(":").map(Number);

        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;
        const currentTimeInMinutes = currentHourParsed * 60 + currentMinuteParsed;

        // Handle shifts that cross midnight
        if (endTimeInMinutes < startTimeInMinutes) {
          return (
            currentTimeInMinutes >= startTimeInMinutes ||
            currentTimeInMinutes <= endTimeInMinutes
          );
        }
        return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
      });

      setShifts(activeShifts);
      if (activeShifts.length > 0) {
        setSelectedShift(activeShifts[0].shiftName); // Default to first active shift
      } else {
        setError("No active shifts available for the current time and day.");
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
      setError("Failed to fetch shifts. Check server status.");
    }
  };

  // Fetch OEE metrics for each station
  const fetchOEEMetrics = async () => {
    if (!selectedShift) return;

    try {
      const productionDate = new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD format
      const metricsData: StationMetrics[] = [];

      for (const station of availableStations) {
        const response = await fetch(
          `http://localhost:5000/api/oee-metrics/get/by-date?station=${encodeURIComponent(station)}&productionDate=${productionDate}&shift=${encodeURIComponent(selectedShift)}`,
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

      setMetrics(metricsData);
      setError(null);
    } catch (error) {
      console.error("Error fetching OEE metrics:", error);
      setError("Failed to fetch OEE metrics. Check server status.");
    }
  };

  // Fetch station status
  const fetchStationStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/stationStatus`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch station status: ${response.status}`);
      }
      const data: StationStatus[] = await response.json();
      setStationStatuses(data);
    } catch (error) {
      console.error("Error fetching station status:", error);
      setError("Failed to fetch station status. Check server status.");
    }
  };

  useEffect(() => {
    fetchShifts(); // Fetch shifts on mount
  }, []);

  useEffect(() => {
    if (availableStations.length > 0 && selectedShift) {
      fetchOEEMetrics(); // Initial fetch
      fetchStationStatus();
      const interval = setInterval(() => {
        fetchOEEMetrics();
        fetchStationStatus();
      }, 15000); // Fetch every 15 seconds
      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [availableStations, selectedShift]);

  // Determine card background color and status
  const getCardBackground = (metric: StationMetrics, index: number) => {
    // Prioritize shiftOff condition
    if (metric.totalTargetQty === 0 && metric.totalAchievedQty === 0) {
      return { className: "bg-black", status: "shiftOff" };
    }

    const status = stationStatuses[index];
    if (!status) {
      return { className: "bg-red-700", status: "stopped" }; // Default to stopped if no status
    }

    const lastTimestamp = new Date(status.last_timestamp);
    const currentTime = new Date();
    const timeDiff = (currentTime.getTime() - lastTimestamp.getTime()) / (1000 * 60); // Difference in minutes

    const isRunning = timeDiff <= 1 && (
      status.final_line_diff !== 0 ||
      status.internal_line_diff !== 0 ||
      status.external_line_diff !== 0
    );

    return isRunning
      ? { className: "bg-green-700", status: "running" }
      : { className: "bg-red-700", status: "stopped" };
  };

  // Calculate summary metrics
  const totalStations = availableStations.length;
  const runningStations = metrics.reduce((count, metric, index) => {
    if (metric.totalTargetQty === 0 && metric.totalAchievedQty === 0) return count; // Exclude shiftOff
    const status = stationStatuses[index];
    if (!status) return count; // Exclude if no status
    const lastTimestamp = new Date(status.last_timestamp);
    const currentTime = new Date();
    const timeDiff = (currentTime.getTime() - lastTimestamp.getTime()) / (1000 * 60);
    return timeDiff <= 1 && (
      status.final_line_diff !== 0 ||
      status.internal_line_diff !== 0 ||
      status.external_line_diff !== 0
    )
      ? count + 1
      : count;
  }, 0);
  const stoppedStations = metrics.reduce((count, metric, index) => {
    if (metric.totalTargetQty === 0 && metric.totalAchievedQty === 0) return count; // Exclude shiftOff
    const status = stationStatuses[index];
    if (!status) return count + 1; // Count as stopped if no status
    const lastTimestamp = new Date(status.last_timestamp);
    const currentTime = new Date();
    const timeDiff = (currentTime.getTime() - lastTimestamp.getTime()) / (1000 * 60);
    return timeDiff > 1 || (
      status.final_line_diff === 0 &&
      status.internal_line_diff === 0 &&
      status.external_line_diff === 0
    )
      ? count + 1
      : count;
  }, 0);
  const shiftOffStations = metrics.filter(
    (metric) => metric.totalTargetQty === 0 && metric.totalAchievedQty === 0
  ).length;

  // Group stations by status
  const runningMetrics = metrics.filter((metric, index) => getCardBackground(metric, index).status === "running");
  const stoppedMetrics = metrics.filter((metric, index) => getCardBackground(metric, index).status === "stopped");
  const shiftOffMetrics = metrics.filter((metric, index) => getCardBackground(metric, index).status === "shiftOff");

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

        {/* Shift Selection */}
        {shifts.length > 0 && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="bg-gray-900/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700 p-5 transition-all duration-300 ease-in-out hover:shadow-green-400/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                  <label htmlFor="shift-select" className="text-lg font-semibold text-green-400 tracking-wide">
                    Select Shift
                  </label>
                </div>
              </div>
              <select
                id="shift-select"
                value={selectedShift || ""}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="w-full bg-gradient-to-br from-gray-800 to-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm font-medium transition-all duration-300 hover:bg-gray-700/80"
              >
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.shiftName} className="bg-gray-800 text-white">
                    {shift.shiftName} ({shift.startTime} - {shift.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="mb-10">
          <div className="bg-gray-900/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-700 p-8 text-white transition-all duration-300 ease-in-out">
            {/* Header */}
            <div className="mb-6 px-6">
              <h2 className="text-2xl font-bold text-green-400 tracking-wider uppercase">
                Station Overview
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between px-6">
              {/* Station Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-5 w-full max-w-2xl">
                {[
                  { label: "Total Stations", color: "blue-400", value: totalStations },
                  { label: "Running", color: "green-400", value: runningStations },
                  { label: "Stopped", color: "red-400", value: stoppedStations },
                  { label: "Shift Off", color: "yellow-400", value: shiftOffStations },
                ].map(({ label, color, value }, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-gray-800 to-gray-700 p-5 rounded-2xl shadow-lg flex items-center gap-4 group transition duration-300 hover:shadow-green-400/30 hover:scale-[1.02]"
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-${color} animate-pulse`}></div>
                    <div>
                      <p className="text-sm text-gray-400 group-hover:text-white transition">{label}</p>
                      <p className="text-xl font-bold text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Branding Badge */}
              <div className="relative w-28 h-28 flex items-center justify-center group">
                {/* Glowing pulse ring */}
                <div className="absolute inset-0 rounded-full border-8 border-green-500 animate-ping opacity-90 blur-sm"></div>

                {/* Outer soft glow */}
                <div className="absolute inset-0 rounded-full bg-green-500 opacity-10 blur-2xl"></div>

                {/* Main badge */}
                <div className="relative z-10 w-28 h-28 bg-gradient-to-br from-gray-900 to-gray-800 border-4 border-green-500 rounded-full flex items-center justify-center text-green-400 font-extrabold text-lg tracking-widest shadow-xl group-hover:scale-105 transition-all duration-500 ease-in-out">
                  <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                    optimaX
                  </span>
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
              {runningMetrics.map((metric, index) => (
                <div
                  key={metric.station}
                  className={`rounded-2xl shadow-xl border border-gray-600 p-6 transition-transform hover:scale-[1.02] duration-300 ease-in-out bg-green-700`}
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
                      <span className="text-gray-300">{metric.oee.toFixed(2)}%</span>
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
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              Stopped Stations ({stoppedStations})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stoppedMetrics.map((metric, index) => (
                <div
                  key={metric.station}
                  className="rounded-2xl shadow-xl border border-gray-600 p-6 bg-red-700 transition-all duration-300 ease-in-out hover:scale-[1.02]"
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
                      <span className="text-gray-300">{metric.oee.toFixed(2)}%</span>
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
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              Shift Off Stations ({shiftOffStations})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {shiftOffMetrics.map((metric, index) => (
                <div
                  key={metric.station}
                  className="rounded-2xl shadow-xl border border-gray-600 p-6 transition-all duration-300 ease-in-out hover:scale-[1.02] bg-black"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white tracking-wide">{metric.station}</h3>
                    <span className="text-xs bg-yellow-500 text-gray-900 px-2 py-1 rounded-full uppercase font-semibold">
                      Shift Off
                    </span>
                  </div>
                  <div className="space-y-3 text-sm font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">OEE</span>
                      <span className="text-gray-300">{metric.oee.toFixed(2)}%</span>
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