"use client";

import { DashboardHeader } from "./dashboardHeader";
import { ProductionTimeline } from "./productionTimeline";
import { BatchInfo } from "./batchInfo";
import { StatusBar } from "./components/StatusBar";
import { useState, useCallback } from "react";
import { PerformanceChart } from "./performanceChart";

export interface Shift {
  id: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  stations: string;
  days: string;
  is_active: number;
}

export default function Page() {
  const [selectedStation, setSelectedStation] = useState("Internal Line");
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [productionQty, setProductionQty] = useState<number>(0);
  const [hourlyOEE, setHourlyOEE] = useState<{ hour: string; oee: number }[]>([]); // New state for hourly OEE

  const handleSelectionChange = useCallback((station: string, shift: Shift | null) => {
    setSelectedStation(station);
    setSelectedShift(shift);
    setProductionQty(0); // Reset when station or shift changes
  }, []);

  const handleProductionUpdate = useCallback((production: number) => {
    setProductionQty(production);
  }, []);

  const handleHourlyOEEUpdate = useCallback((hourlyOEEData: { hour: string; oee: number }[]) => {
    setHourlyOEE(hourlyOEEData);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1E32] text-white flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 shadow-lg">
        <div className="px-6 py-4">
          <DashboardHeader onSelectionChange={handleSelectionChange} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Batch Info */}
          <div className="md:col-span-5 flex items-center justify-center bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
            <BatchInfo
              station={selectedStation}
              shift={selectedShift?.shiftName || ""}
              productionQty={productionQty}
            />
          </div>

          {/* Performance Chart */}
          <div className="md:col-span-7 bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
            <PerformanceChart
              station={selectedStation}
              shift={selectedShift?.shiftName || ""}
              productionQty={productionQty}
              hourlyOEE={hourlyOEE} // Pass hourly OEE prop
            />
          </div>

          {/* Production Timeline */}
          <div className="md:col-span-12 bg-gray-900 rounded-xl shadow-lg border border-gray-700">
            <ProductionTimeline
              station={selectedStation}
              shift={selectedShift}
              onProductionUpdate={handleProductionUpdate}
              onHourlyOEEUpdate={handleHourlyOEEUpdate} // Pass callback for hourly OEE
            />
          </div>
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="sticky bottom-0 z-10 bg-gray-900 border-t border-transparent bg-gradient-to-r from-green-500/20 to-indigo-500/20 shadow-lg">
        <StatusBar stations={selectedStation} shift={selectedShift} />
      </footer>
    </div>
  );
}