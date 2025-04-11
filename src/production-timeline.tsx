"use client";

import { useEffect, useState } from "react";
import { Shift } from "./page";

interface MachineData {
  timestamp: string;
  [key: string]: number | string;
}

interface TimeSlot {
  hour: number;
  statuses: ("red" | "green" | "yellow" | "none")[];
  markers: boolean[];
  production: number[];
  hourlyProduction: number;
}

export function ProductionTimeline({ station, shift }: { station: string; shift: Shift | null }) {
  // console.log("ProductionTimeline", station, shift?.startTime, shift?.endTime);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [machineData, setMachineData] = useState<MachineData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchMachineData = async () => {
    try {
      // Prepare the payload
      const payload = {
        line: station,
        startTime: shift?.startTime || "00:00",
        endTime: shift?.endTime || "23:59",
      };

      const url = "http://localhost:5000/api/machineData"; // Always POST to this endpoint
      // console.log("Sending payload to URL:", url, payload); // Debug log

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: MachineData[] = await response.json();
      // console.log("Received data:", data); // Verify the response
      setMachineData(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching machine data:", error);
      setError("Failed to fetch machine data. Check server status.");
    }
  };

  useEffect(() => {
    fetchMachineData();
    const interval = setInterval(fetchMachineData, 15000);
    return () => clearInterval(interval);
  }, [station, shift]);

  useEffect(() => {
    const generateTimeline = () => {
      if (!shift) {
        setTimeSlots([]);
        return;
      }

      const startHour = parseInt(shift.startTime.split(":")[0]);
      const endHour = parseInt(shift.endTime.split(":")[0]);
      const slots: TimeSlot[] = [];

      let currentHour = startHour;
      while (true) {
        slots.push({
          hour: currentHour,
          statuses: Array(60).fill("none"),
          markers: Array(60).fill(false),
          production: Array(60).fill(0),
          hourlyProduction: 0,
        });

        currentHour = (currentHour + 1) % 24;
        if (currentHour === endHour) {
          slots.push({
            hour: currentHour,
            statuses: Array(60).fill("none"),
            markers: Array(60).fill(false),
            production: Array(60).fill(0),
            hourlyProduction: 0,
          });
          break;
        }
      }

      if (machineData.length > 1) {
        machineData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        const column = station.replace(" Line", "_line").toLowerCase();

        const productionPerMinute: { [hour: number]: { [minute: number]: number } } = {};
        const lineDataPerMinute: { [hour: number]: { [minute: number]: number } } = {};

        for (let i = 0; i < machineData.length; i++) {
          const current = machineData[i];
          const timestamp = new Date(current.timestamp);
          const hour = timestamp.getHours();
          const minutes = timestamp.getMinutes();

          if (!lineDataPerMinute[hour]) {
            lineDataPerMinute[hour] = {};
          }
          lineDataPerMinute[hour][minutes] = Number(current[column]);
        }

        for (let i = 1; i < machineData.length; i++) {
          const current = machineData[i];
          const previous = machineData[i - 1];
          const production = Number(current[column]) - Number(previous[column]);

          const timestamp = new Date(current.timestamp);
          const hour = timestamp.getHours();
          const minutes = timestamp.getMinutes();

          if (!productionPerMinute[hour]) {
            productionPerMinute[hour] = {};
          }
          if (!productionPerMinute[hour][minutes]) {
            productionPerMinute[hour][minutes] = 0;
          }

          productionPerMinute[hour][minutes] += production;
        }

        slots.forEach((slot) => {
          for (let minute = 0; minute < 60; minute++) {
            const production = productionPerMinute[slot.hour]?.[minute] || 0;
            slot.production[minute] = production;
            if (production >= 4) {
              slot.statuses[minute] = "green";
              slot.markers[minute] = true;
            } else if (production > 0 && production < 4) {
              slot.statuses[minute] = "yellow";
              slot.markers[minute] = true;
            } else if (production === 0 && productionPerMinute[slot.hour]?.[minute] === undefined) {
              slot.statuses[minute] = "none";
            } else {
              slot.statuses[minute] = "red";
            }
          }

          const hourData = lineDataPerMinute[slot.hour];
          if (hourData) {
            const minutes = Object.keys(hourData)
              .map(Number)
              .sort((a, b) => a - b);
            if (minutes.length > 0) {
              const firstMinute = minutes[0];
              const lastMinute = minutes[minutes.length - 1];
              slot.hourlyProduction = hourData[lastMinute] - hourData[firstMinute];
            }
          }
        });
      }

      setTimeSlots(slots);
    };

    generateTimeline();
  }, [shift, machineData, station]);

  return (
    <div className="space-y-px pt-10">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {timeSlots.map((slot) => (
        <div key={slot.hour} className="flex items-stretch h-8">
          <div className="w-8 flex items-center justify-end pr-2 text-sm tabular-nums">
            {String(slot.hour).padStart(2, "0")}
          </div>
          <div className="flex-1 grid grid-cols-[repeat(60,_minmax(0,_1fr))] gap-px bg-black overflow-x-auto">
            {slot.markers.map((marker, i) => {
              const minuteStart = `${String(slot.hour).padStart(2, "0")}:${String(i).padStart(2, "0")}:00`;
              const minuteEnd = `${String(slot.hour).padStart(2, "0")}:${String(i).padStart(2, "0")}:59`;
              const hasData = slot.production[i] > 0 || slot.statuses[i] !== "none";
              const tooltip = hasData ? `${minuteStart}–${minuteEnd}\nProduction: ${slot.production[i]} pcs` : undefined;
              return (
                <div
                  key={i}
                  title={tooltip}
                  className={`relative ${
                    slot.statuses[i] === "red"
                      ? "bg-red-600"
                      : slot.statuses[i] === "green"
                      ? "bg-[#0AAC00]"
                      : slot.statuses[i] === "yellow"
                      ? "bg-[#FDF502]"
                      : "bg-black"
                  }`}
                >
                  {/* {marker && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                  )} */}
                </div>
              );
            })}
          </div>
          <div className="w-16 flex items-center justify-end pl-2 text-sm tabular-nums">
            <span className="text-white">
              {slot.hourlyProduction !== 0 || machineData.length > 0
                ? `${slot.hourlyProduction}/480`
                : "0/480"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}