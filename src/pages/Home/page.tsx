"use client";

import { useState, useCallback, useEffect, useContext } from "react";
import { StatusBar } from "../../components/home/Footer";
import { AuthContext } from "../../context/AuthContext";
import { DashboardHeader } from "../../components/home/Header";
import { BatchInfo } from "../../components/home/BatchInfo";
import { PerformanceChart } from "../../components/home/PerformanceChart";
import { ProductionTimeline } from "../../components/home/ProductionTimeline";




export interface Shift {
  id: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  stations: string;
  days: string;
  is_active: number;
}

interface Station {
  id: number;
  stations: string;
  stationsGroup: string;
  requireOperator: string;
  emptyShiftReason: string;
  unhappyOee: number;
  happyOee: number;
  is_active: number;
  creator: string | null;
  sys_date_time: string;
  updated_at: string | null;
}

export default function Page() {
  const [selectedStation, setSelectedStation] = useState("Final Line");
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [count, setCount] = useState(0);
  const [stations, setStations] = useState<Station[]>([]);
  

  const auth = useContext(AuthContext);


  // Fetch stations once
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/stations");
        const data = await response.json();
        if (response.ok) {
          setStations(data);
        } else {
          console.error("Error fetching stations:", data.error);
        }
      } catch (error) {
        console.error("Error fetching stations:", error);
      }
    };

    fetchStations();
  }, []);


  // Handle station & shift change
  const handleSelectionChange = useCallback(
    (station: string, shift: Shift | null) => {
      setSelectedStation(station);
      setSelectedShift(shift);
    },
    []
  );

  // Fetch product records
  const fetchProductRecords = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/products/specificProductRecords?station=${encodeURIComponent(
          selectedStation
        )}&shift=${selectedShift?.shiftName}`
      );
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setCount(data.length);
    } catch (error) {
      console.error("Error fetching product records:", error);
    }
  };

  // Run fetchProductRecords when station or shift changes
  useEffect(() => {
    if (selectedShift) {
      fetchProductRecords();
    }
  }, [selectedStation, selectedShift]);

    
 const postOEEMetrics = async () => {
  try {
    if (!selectedShift || !selectedStation ) return;

    const creator = auth?.user?.userId;

    for (const station of stations) {
      const payload = {
        station: station.stations,
        productionDate: new Date().toISOString().split("T")[0],
        shift: selectedShift.shiftName,
        shiftStartTime: parseInt(selectedShift.startTime.split(":")[0]),
        shiftEndTime: parseInt(selectedShift.endTime.split(":")[0]),
        creator,
      };

      const response = await fetch("http://localhost:5000/api/oee-metrics/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`POST error for station ${station.stations}! Status: ${response.status}`);
      }
    }
  } catch (error) {
    console.error("Error posting OEE metrics:", error);
  }
};

   

  

  // Fetch OEE metrics
  const getOEEMetrics = async () => {
    try {
      if (!selectedShift || !selectedStation) return;

      const productionDate = new Date().toISOString().split("T")[0];

      const response = await fetch(
        `http://localhost:5000/api/oee-metrics/get/by-date?station=${encodeURIComponent(
          selectedStation
        )}&productionDate=${productionDate}&shift=${selectedShift.shiftName}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`GET error! Status: ${response.status}`);
      }

      const data = await response.json();
      // console.log("OEE metrics:", data);
    } catch (error) {
      console.error("Error fetching OEE metrics:", error);
    }
  };

  // Poll every 15 seconds for OEE post + get
  useEffect(() => {
    const interval = setInterval(() => {
      postOEEMetrics();
      getOEEMetrics();
    }, 15000);

    return () => clearInterval(interval); // Cleanup
  }, [selectedStation, selectedShift, count]);


  return (
    <div className="min-h-screen bg-[#0B1E32] text-white flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 shadow-lg">
        <div className="px-6 py-4">
          <DashboardHeader onSelectionChange={handleSelectionChange} />
        </div>
      </header>

      {/* Main Content */}
      {count > 0 ? (
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Batch Info */}
            <div className="md:col-span-5 flex items-center justify-center bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
              <BatchInfo
                station={selectedStation}
                shift={selectedShift?.shiftName || ""}
              />
            </div>

            {/* Performance Chart */}
            <div className="md:col-span-7 bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
              <PerformanceChart
                station={selectedStation}
                shift={selectedShift?.shiftName || ""}
              />
            </div>

            {/* Production Timeline */}
            <div className="md:col-span-12 bg-gray-900 rounded-xl shadow-lg border border-gray-700">
              <ProductionTimeline
                station={selectedStation}
                shift={selectedShift}
              />
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-gray-900 border border-red-500 rounded-xl shadow-lg p-6 text-center flex flex-col items-center justify-center space-y-4 animate-pulse">
            <svg
              className="w-10 h-10 text-red-400"
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
            <h1 className="text-xl font-semibold text-red-400">
              No product selected
            </h1>
            <p className="text-sm text-gray-400">
              Please select a product and load the dashboard data.
            </p>
          </div>
        </div>
      )}

      {/* Sticky Footer */}
      <footer className="sticky bottom-0 z-10 bg-gray-900 border-t border-transparent bg-gradient-to-r from-green-500/20 to-indigo-500/20 shadow-lg">
        <StatusBar stations={selectedStation} shift={selectedShift} />
      </footer>
    </div>
  );
}
