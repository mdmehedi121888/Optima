"use client";
"use client";

import { AlignJustify, ChevronLeft, ChevronRight, Settings, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { Shift } from "./page";

interface DashboardHeaderProps {
  onSelectionChange: (station: string, shift: Shift | null) => void;
}

export function DashboardHeader({ onSelectionChange }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [stationIndex, setStationIndex] = useState<number>(0);

  const stations = ["Internal Line", "External Line", "Final Line", "Valve Plate"];
  const currentDay = currentTime.toLocaleDateString("en-US", { weekday: "long" });

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/shifts/specific?stations=${encodeURIComponent(stations[stationIndex])}&days=${encodeURIComponent(currentDay)}`
        );
        const data = await response.json();
        if (response.ok) {
          setShifts(data);
          if (data.length > 0) {
            setSelectedIndex(0);
            onSelectionChange(stations[stationIndex], data[0]);
          } else {
            setSelectedIndex(-1);
            onSelectionChange(stations[stationIndex], null);
          }
        } else {
          console.error("Error from server:", data.error);
        }
      } catch (error) {
        console.error("Error fetching shifts:", error);
      }
    };

    fetchShifts();
  }, [stationIndex, currentDay, onSelectionChange]); // Include onSelectionChange as a stable dependency

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShiftChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < shifts.length) {
      setSelectedIndex(newIndex);
      onSelectionChange(stations[stationIndex], shifts[newIndex]);
    }
  };

  const handleStationChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < stations.length) {
      setStationIndex(newIndex);
    }
  };

  const currentShift = shifts[selectedIndex];
  const todayDate = currentTime.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
  }).split("/").reverse().join(".");

  return (
    <div className="h-16 border-b border-gray-800 px-4 flex items-center justify-between relative">
      <div className="flex items-center gap-4">
        
        {!sidebarOpen && (
          <AlignJustify className="cursor-pointer" onClick={() => setSidebarOpen(true)} />
        )}
        {sidebarOpen && (
          <div className="absolute left-0 top-0 z-50">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              className="p-1 hover:bg-gray-800 rounded-full"
              onClick={() => handleStationChange(stationIndex - 1)}
              disabled={stationIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="p-1 hover:bg-gray-800 rounded-full"
              onClick={() => handleStationChange(stationIndex + 1)}
              disabled={stationIndex === stations.length - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div>
            <div className="text-[10px] uppercase text-gray-400 leading-tight text-left">STATION</div>
            <div className="text-lg font-semibold leading-tight">{stations[stationIndex]}</div>
          </div>
        </div>
      </div>

      <div className="flex items-left gap-6 justify-center flex-1">
        <div className="flex gap-1">
          <button
            className="p-1 hover:bg-gray-800 rounded-full disabled:opacity-50"
            onClick={() => handleShiftChange(selectedIndex - 1)}
            disabled={selectedIndex <= 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="p-1 hover:bg-gray-800 rounded-full disabled:opacity-50"
            onClick={() => handleShiftChange(selectedIndex + 1)}
            disabled={selectedIndex === shifts.length - 1 || selectedIndex === -1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            className="p-1 hover:bg-gray-800 rounded"
            onClick={() => handleShiftChange(shifts.length - 1)}
            disabled={shifts.length === 0}
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col items-left">
          <div className="text-[10px] uppercase text-gray-400 leading-tight text-left">SHIFT</div>
          <div className="text-lg font-semibold leading-tight">
            {currentShift 
              ? `${currentDay} ${todayDate} - (${currentShift.shiftName})`
              : "No Shift Available"}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          <span className="px-4 py-1.5 text-sm font-bold text-white bg-green-600 rounded shadow-md tracking-wide">
            LIVE
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-4xl font-mono tabular-nums">
          {currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })}
        </div>
        <button className="p-1 hover:bg-gray-800 rounded">
          <Settings className="w-5 h-5" />
        </button>
      </div>
      
    </div>
  );
}