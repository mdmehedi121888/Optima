"use client";

import { useEffect, useState } from "react";
import { Shift } from "./page";

interface MachineData {
  timestamp: string;
  [key: string]: number | string;
}

interface DowntimeFormData {
  startTime: string;
  endTime: string;
  problem_name: string;
  location: string;
  planned_status: "planned" | "unplanned";
}

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

interface TimeSlot {
  hour: number;
  statuses: ("red" | "green" | "yellow" | "none")[];
  downtimeStatuses: { status: "planned" | "unplanned" | null; problem_name: string | null }[];
  markers: boolean[];
  production: number[];
  hourlyProduction: number;
}

interface ProductionTimelineProps {
  station: string;
  shift: Shift | null;
  onProductionUpdate: (production: number) => void;
}

export function ProductionTimeline({ station, shift, onProductionUpdate }: ProductionTimelineProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [machineData, setMachineData] = useState<MachineData[]>([]);
  const [downtimeRecords, setDowntimeRecords] = useState<DowntimeFormData[]>([]);
  const [productRecords, setProductRecords] = useState<ProductRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch machine data
  const fetchMachineData = async () => {
    try {
      const payload = {
        line: station,
        startTime: shift?.startTime || "00:00",
        endTime: shift?.endTime || "23:59",
      };

      const url = "http://localhost:5000/api/machineData";
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
      setMachineData(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching machine data:", error);
      setError("Failed to fetch machine data. Check server status.");
    }
  };

  // Fetch downtime records
  const fetchDowntimeRecords = async () => {
    try {
      if (!station || !shift?.shiftName) return;
      const response = await fetch(
        `http://localhost:5000/api/downtimeProblem/specificDowntimeRecords?station=${station}&shift=${shift.shiftName}`
      );
      if (!response.ok) throw new Error("Failed to fetch downtime records");
      const data = await response.json();

      const records = Array.isArray(data)
        ? data.map((item: any) => ({
            startTime: item.startTime || "",
            endTime: item.endTime || "",
            problem_name: item.problem_name || "",
            location: item.location || "",
            planned_status: item.planned_status || "unplanned",
          }))
        : [];

      setDowntimeRecords(records);
    } catch (error) {
      console.error("Error fetching downtime records:", error);
      setError("Failed to fetch downtime records. Check server status.");
    }
  };

  // Fetch product records
  const fetchProductRecords = async () => {
    try {
      if (!station || !shift?.shiftName) return;
      const response = await fetch(
        `http://localhost:5000/api/products/specificProductRecords?station=${encodeURIComponent(station)}&shift=${shift.shiftName}`
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
            unitsPerSensorSignal: item.unitsPerSensorSignal ?? "1",
            startTime: item.startTime ?? "",
            endTime: item.endTime ?? "",
            qty: item.qty ?? "0",
            is_active: item.is_active ?? 0,
            creator: item.creator ?? null,
            sys_date_time: item.sys_date_time ?? "",
            updated_at: item.updated_at ?? null,
          }))
        : [];

      setProductRecords(records);
    } catch (error) {
      console.error("Error fetching product records:", error);
      setError("Failed to fetch product records. Check server status.");
    }
  };

  useEffect(() => {
    fetchMachineData();
    fetchDowntimeRecords();
    fetchProductRecords();
    const interval = setInterval(() => {
      fetchMachineData();
      fetchDowntimeRecords();
      fetchProductRecords();
    }, 15000);
    return () => clearInterval(interval);
  }, [station, shift]);

  useEffect(() => {
    const generateTimeline = () => {
      if (!shift) {
        setTimeSlots([]);
        onProductionUpdate(0);
        return;
      }

      const startHour = parseInt(shift.startTime.split(":")[0]);
      const endHour = parseInt(shift.endTime.split(":")[0]);
      const slots: TimeSlot[] = [];

      // Generate time slots for the shift
      let currentHour = startHour;
      while (true) {
        slots.push({
          hour: currentHour,
          statuses: Array(60).fill("none"),
          downtimeStatuses: Array(60).fill({ status: null, problem_name: null }),
          markers: Array(60).fill(false),
          production: Array(60).fill(0),
          hourlyProduction: 0,
        });

        currentHour = (currentHour + 1) % 24;
        if (currentHour === endHour) {
          slots.push({
            hour: currentHour,
            statuses: Array(60).fill("none"),
            downtimeStatuses: Array(60).fill({ status: null, problem_name: null }),
            markers: Array(60).fill(false),
            production: Array(60).fill(0),
            hourlyProduction: 0,
          });
          break;
        }
      }

      // Find active product
      const currentTime = new Date("2025-04-29T15:00:00"); // Mock time
      let activeProduct: ProductRecord | null = null;

      for (const record of productRecords) {
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
            activeProduct = record;
            break;
          }
        } catch (error) {
          console.error(`Error processing record ID ${record.id}:`, record, error);
        }
      }

      console.log("Selected active product:", activeProduct);

      // Use cycleTime and unitsPerSensorSignal
      const cycleTime = activeProduct ? Number(activeProduct.cycleTime) || 240 : 240;
      const unitsPerSensorSignal = activeProduct ? Number(activeProduct.unitsPerSensorSignal) || 1 : 1;
      const productionThreshold = cycleTime / 60;

      // Apply downtime periods
      downtimeRecords.forEach((record, index) => {
        if (record.startTime && record.endTime) {
          try {
            const startTime = record.startTime.split(":").slice(0, 2).join(":");
            const endTime = record.endTime.split(":").slice(0, 2).join(":");
            const start = new Date(`1970-01-01T${startTime}:00`);
            const end = new Date(`1970-01-01T${endTime}:00`);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              throw new Error("Invalid time format");
            }

            const startHour = start.getHours();
            const startMinute = start.getMinutes();
            const endHour = end.getHours();
            const endMinute = end.getMinutes();

            slots.forEach((slot) => {
              if (slot.hour >= startHour && slot.hour <= endHour) {
                const startMin = slot.hour === startHour ? startMinute : 0;
                const endMin = slot.hour === endHour ? endMinute : 59;

                for (let minute = startMin; minute <= endMin; minute++) {
                  slot.downtimeStatuses[minute] = {
                    status: record.planned_status === "planned" ? "planned" : "unplanned",
                    problem_name: record.problem_name || "Unknown",
                  };
                }
              }
            });
          } catch (error) {
            console.error(`Error processing downtime record ${index}:`, record, error);
          }
        }
      });

      // Apply production-based statuses and calculate total production
      let totalProduction = 0;
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
          const production = (Number(current[column]) - Number(previous[column])) * unitsPerSensorSignal;

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

          // Add to totalProduction if within active product's time range
          if (activeProduct) {
            const start = parseTime(activeProduct.startTime);
            const end = parseTime(activeProduct.endTime);
            if (start && end) {
              const startTotalMinutes = start.getHours() * 60 + start.getMinutes();
              let endTotalMinutes = end.getHours() * 60 + end.getMinutes();
              if (endTotalMinutes < startTotalMinutes) {
                endTotalMinutes += 24 * 60;
              }
              const currentTotalMinutes = hour * 60 + minutes;
              if (
                currentTotalMinutes >= startTotalMinutes &&
                currentTotalMinutes <= endTotalMinutes
              ) {
                totalProduction += production;
              }
            }
          }
        }

        slots.forEach((slot) => {
          for (let minute = 0; minute < 60; minute++) {
            if (slot.downtimeStatuses[minute].status) {
              continue;
            }

            const production = productionPerMinute[slot.hour]?.[minute] || 0;
            slot.production[minute] = production;
            if (production >= productionThreshold) {
              slot.statuses[minute] = "green";
              slot.markers[minute] = true;
            } else if (production > 0 && production < productionThreshold) {
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
              slot.hourlyProduction = (hourData[lastMinute] - hourData[firstMinute]) * unitsPerSensorSignal;
            }
          }
        });
      }

      // Update parent with total production
      onProductionUpdate(totalProduction);

      setTimeSlots(slots);
    };

    generateTimeline();
  }, [shift, machineData, station, downtimeRecords, productRecords, onProductionUpdate]);

  return (
    <div className="p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-700">
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg flex items-center gap-2 mb-6 animate-pulse">
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

      {/* Timeline Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs uppercase text-gray-400 font-semibold tracking-wider flex items-center gap-2">
          Production Timeline
          <div className="h-0.5 w-24 bg-green-500 rounded-full" />
        </h2>
        <span className="text-sm text-gray-400">
          {station} - {shift?.shiftName || "No Shift"}
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {timeSlots.map((slot) => {
          const cycleTime = productRecords.length > 0 ? Number(productRecords[0].cycleTime) || 240 : 240;
          return (
            <div
              key={slot.hour}
              className="flex items-stretch h-8 bg-gray-800/50 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              {/* Hour Label */}
              <div className="w-16 flex items-center justify-end pr-3 text-sm font-semibold text-gray-300 tabular-nums">
                {String(slot.hour).padStart(2, "0")}:00
              </div>
              {/* Minute Grid */}
              <div className="flex-1 grid grid-cols-[repeat(60,_minmax(0,_1fr))] gap-px bg-gray-700">
                {slot.markers.map((marker, i) => {
                  const minuteStart = `${String(slot.hour).padStart(2, "0")}:${String(i).padStart(2, "0")}:00`;
                  const minuteEnd = `${String(slot.hour).padStart(2, "0")}:${String(i).padStart(2, "0")}:59`;
                  const hasData = slot.production[i] > 0 || slot.statuses[i] !== "none";
                  const tooltip =
                    slot.downtimeStatuses[i].status
                      ? `${minuteStart}–${minuteEnd}\nDowntime: ${slot.downtimeStatuses[i].status}\nProblem: ${slot.downtimeStatuses[i].problem_name}`
                      : hasData
                      ? `${minuteStart}–${minuteEnd}\nProduction: ${slot.production[i]} pcs`
                      : undefined;
                  return (
                    <div
                      key={i}
                      title={tooltip}
                      className={`
                        relative
                        ${slot.downtimeStatuses[i].status === "planned" ? "bg-gray-800" : ""}
                        ${slot.downtimeStatuses[i].status === "unplanned" ? "bg-red-900" : ""}
                        ${slot.statuses[i] === "red" ? "bg-red-500" : ""}
                        ${slot.statuses[i] === "green" ? "bg-green-500" : ""}
                        ${slot.statuses[i] === "yellow" ? "bg-yellow-500" : ""}
                        
                        hover:opacity-80 transition-opacity duration-200
                      `}
                    />
                  );
                })}
              </div>
              {/* Hourly Production */}
              <div className="w-24 flex items-center justify-end pl-3 text-sm font-semibold text-white tabular-nums">
                {slot.hourlyProduction !== 0 || machineData.length > 0
                  ? `${slot.hourlyProduction}/${cycleTime}`
                  : `0/${cycleTime}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}