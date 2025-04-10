"use client";
"use client";

import { ChevronLeft, ChevronRight, Settings, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";

interface Shift {
  id: number;
  date: string;
  shift: string;
}

export function DashboardHeader() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Fetch shift data from API
  useEffect(() => {
    fetch("http://localhost:5000/shift")
      .then((response) => response.json())
      .then((data) => {
        setShifts(data);
        if (data.length > 0) {
          setSelectedIndex(0);
        }
      })
      .catch((error) => console.error("Error fetching shifts:", error));
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Function to navigate shifts
  const handleShiftChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < shifts.length) {
      setSelectedIndex(newIndex);
    }
  };

  // Get current shift details
  const currentShift = shifts[selectedIndex];
  const dayName = currentShift
    ? new Date(currentShift.date).toLocaleDateString("en-US", { weekday: "long" })
    : "";

  const shiftLabel =
    currentShift?.shift === "A" ? "Morning" : currentShift?.shift === "B" ? "Evening" : "Night";

  return (
    <div className="h-16 border-b border-gray-800 px-4 flex items-center justify-between">
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-gray-800 rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="p-1 hover:bg-gray-800 rounded">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div>
          <div className="text-[10px] uppercase text-gray-400 leading-tight">STATION</div>
          <div className="text-lg font-semibold leading-tight">Valve Plate</div>
        </div>
      </div>

      <div className="flex items-right gap-6">
        <div className="flex flex-col items-end">
          <div className="text-[10px] uppercase text-gray-400 leading-tight">SHIFT</div>
          <div className="text-lg font-semibold leading-tight">
            {currentShift ? `${dayName} ${currentShift.date} - ${shiftLabel}` : "No Shift Available"}
          </div>
        </div>

        {/* Shift Navigation Buttons */}
        <div className="flex gap-1">
          <button
            className="p-1 hover:bg-gray-800 rounded disabled:opacity-50"
            onClick={() => handleShiftChange(selectedIndex - 1)}
            disabled={selectedIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            className="p-1 hover:bg-gray-800 rounded disabled:opacity-50"
            onClick={() => handleShiftChange(selectedIndex + 1)}
            disabled={selectedIndex === shifts.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            className="p-1 hover:bg-gray-800 rounded"
            onClick={() => handleShiftChange(shifts.length - 1)}
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-baseline gap-1">
        <span className="text-4xl font-mono tabular-nums">
          {currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </span>
        <span className="text-xl text-gray-500">17</span>
      </div>

      <button className="p-1 hover:bg-gray-800 rounded">
        <Settings className="w-5 h-5" />
      </button>

      </div>

      
    </div>
  );
  );
}


