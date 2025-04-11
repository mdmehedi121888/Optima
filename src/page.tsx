import { DashboardHeader } from "./dashboard-header";
import { PerformanceChart } from "./performance-chart";
import { ProductionTimeline } from "./production-timeline";
import { StatusBar } from "./status-bar";
import { BatchInfo } from "./batch-info";
import { useState, useCallback } from "react";

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

  // Memoize the callback to keep it stable across renders
  const handleSelectionChange = useCallback((station: string, shift: Shift | null) => {
    setSelectedStation(station);
    setSelectedShift(shift);
  }, []); // Empty dependency array since it only uses setState functions

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <DashboardHeader onSelectionChange={handleSelectionChange} />
      <div className="flex-1 grid grid-cols-12 gap-4 p-4">
        <div className="col-span-5 border border-indigo-600">
          <BatchInfo />
        </div>
        <div className="col-span-7 border border-indigo-600">
          <PerformanceChart />
        </div>
        <div className="col-span-12 border border-indigo-600">
          <ProductionTimeline station={selectedStation} shift={selectedShift} />
        </div>
      </div>
      <StatusBar stations={selectedStation} shift={selectedShift}/>
    </div>
  );
}