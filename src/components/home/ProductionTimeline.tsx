"use client";

import { useContext, useEffect, useState } from "react";
import { Shift } from "../../pages/Home/page";
import { AuthContext } from "../../context/AuthContext";

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

interface OEEMetrics {
  hour: string;
  targetPerHour: number;
  achievedQtyPerHour: number;
  plannedDowntime: number;
  unplannedDowntime: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

interface OEEMetricsResponse {
  message: string;
  data: {
    hourlyOEE: OEEMetrics[];
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

interface TimeSlot {
  hour: number;
  statuses: ("red" | "green" | "yellow" | "none")[];
  downtimeStatuses: { status: "planned" | "unplanned" | null; problem_name: string | null }[];
  markers: boolean[];
  production: number[];
  hourlyProduction: number;
  targetQty: number;
  unitsPerSensorSignal: number;
}

interface ProductionTimelineProps {
  station: string;
  shift: Shift | null;
}

export function ProductionTimeline({ station, shift }: ProductionTimelineProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [machineData, setMachineData] = useState<MachineData[]>([]);
  const [downtimeRecords, setDowntimeRecords] = useState<DowntimeFormData[]>([]);
  const [productRecords, setProductRecords] = useState<ProductRecord[]>([]);
  const [oeeMetrics, setOEEMetrics] = useState<OEEMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);

  const auth = useContext(AuthContext);
  const creator = auth?.user?.userId;

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
        startTime: shift?.startTime,
        endTime: shift?.endTime,
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

  // Fetch OEE metrics
  const fetchOEEMetrics = async () => {
    try {
      if (!station || !shift?.shiftName) return;
      const productionDate = new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD format
      const response = await fetch(
        `http://localhost:5000/api/oee-metrics/get/by-date?station=${encodeURIComponent(station)}&productionDate=${productionDate}&shift=${shift.shiftName}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data: OEEMetricsResponse = await response.json();
      setOEEMetrics(data.data.hourlyOEE);
    } catch (error) {
      console.error("Error fetching OEE metrics:", error);
      setError("Failed to fetch OEE metrics. Check server status.");
    }
  };

  // Post OEE metrics
  // const postOEEMetrics = async () => {
  //   try {
  //     if (!shift || !station || !productRecords.length) return;

  //     const payload = {
  //       station,
  //       productionDate: new Date().toISOString().split("T")[0],
  //       shift: shift.shiftName,
  //       shiftStartTime: parseInt(shift.startTime.split(":")[0]),
  //       shiftEndTime: parseInt(shift.endTime.split(":")[0]),
  //       creator,
  //     };

  //     const response = await fetch("http://localhost:5000/api/oee-metrics/post", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! Status: ${response.status}`);
  //     }
  //   } catch (error) {
  //     console.error("Error posting OEE metrics:", error);
  //     setError("Failed to post OEE metrics. Check server status.");
  //   }
  // };

  useEffect(() => {
    fetchMachineData();
    fetchDowntimeRecords();
    fetchProductRecords();
    fetchOEEMetrics();
    // postOEEMetrics();
    const interval = setInterval(() => {
      fetchMachineData();
      fetchDowntimeRecords();
      fetchProductRecords();
      fetchOEEMetrics();
      // postOEEMetrics();
    }, 15000);
    return () => clearInterval(interval);
  }, [station, shift]);

  useEffect(() => {
    const generateTimeline = () => {
      if (!shift) {
        setTimeSlots([]);
        return;
      }

      const startHour = parseInt(shift.startTime.split(":")[0]);
      const endHour = parseInt(shift.endTime.split(":")[0]) - 1;
      const slots: TimeSlot[] = [];

      let currentHour = startHour;

      while (true) {
        slots.push({
          hour: currentHour,
          statuses: Array(60).fill("none"),
          downtimeStatuses: Array(60).fill({ status: null, problem_name: null }),
          markers: Array(60).fill(false),
          production: Array(60).fill(0),
          hourlyProduction: 0,
          targetQty: 0,
          unitsPerSensorSignal: 1,
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
            targetQty: 0,
            unitsPerSensorSignal: 1,
          });
          break;
        }
      }

      // Map hours to active products
      const hourToProductMap: { [hour: number]: ProductRecord | null } = {};

      slots.forEach((slot) => {
        hourToProductMap[slot.hour] = null;
        productRecords.forEach((record) => {
          if (!record.startTime || !record.endTime) {
            console.warn(`Missing startTime or endTime for record ID ${record.id}:`, record);
            return;
          }

          const start = parseTime(record.startTime);
          const end = parseTime(record.endTime);

          if (!start || !end) {
            console.warn(`Invalid time format for record ID ${record.id}:`, record);
            return;
          }

          let startTotalMinutes = start.getHours() * 60 + start.getMinutes();
          let endTotalMinutes = end.getHours() * 60 + end.getMinutes();
          if (endTotalMinutes < startTotalMinutes) {
            endTotalMinutes += 24 * 60;
          }

          const slotTotalMinutes = slot.hour * 60;
          if (slotTotalMinutes >= startTotalMinutes && slotTotalMinutes < endTotalMinutes) {
            hourToProductMap[slot.hour] = record;
          }
        });
      });

      // Apply downtime periods only for hours with active products
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
            let endMinute = end.getMinutes();

            // Adjust endMinute to color the previous minute
            endMinute = endMinute - 1;

            slots.forEach((slot) => {
              // Only apply downtime if the hour has an active product
              if (hourToProductMap[slot.hour] && slot.hour >= startHour && slot.hour <= endHour) {
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
        const column = station.replace(" Line", "_line_diff").toLowerCase();

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
          const timestamp = new Date(current.timestamp);
          const hour = timestamp.getHours();
          const minutes = timestamp.getMinutes();

          const activeProduct = hourToProductMap[hour];
          const unitsPerSensorSignal = activeProduct ? Number(activeProduct.unitsPerSensorSignal) : 1;
          const production = Number(current[column]) * unitsPerSensorSignal;

          if (!productionPerMinute[hour]) {
            productionPerMinute[hour] = {};
          }
          if (!productionPerMinute[hour][minutes]) {
            productionPerMinute[hour][minutes] = 0;
          }

          productionPerMinute[hour][minutes] += production;

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
          const activeProduct = hourToProductMap[slot.hour];
          // Skip processing if no active product
          if (!activeProduct) {
            return;
          }

          const cycleTime = activeProduct ? Number(activeProduct.cycleTime) : 0;
          const unitsPerSensorSignal = activeProduct ? Number(activeProduct.unitsPerSensorSignal) : 1;
          const productionThreshold = cycleTime / 60;

          // Set targetQty from OEE metrics
          const oeeMetric = oeeMetrics?.find((metric) => {
            const [start] = metric.hour.split(" - ");
            const hour = parseInt(start.split(":")[0]);
            return hour === slot.hour;
          });
          slot.targetQty = oeeMetric ? oeeMetric.targetPerHour : 0;

          const start = parseTime(activeProduct.startTime);
          const end = parseTime(activeProduct.endTime);
          if (start && end) {
            let startTotalMinutes = start.getHours() * 60 + start.getMinutes();
            let endTotalMinutes = end.getHours() * 60 + end.getMinutes();
            if (endTotalMinutes < startTotalMinutes) {
              endTotalMinutes += 24 * 60;
            }
            const slotStartMinutes = slot.hour * 60;
            const slotEndMinutes = slotStartMinutes + 59;
            if (slotStartMinutes >= startTotalMinutes && slotEndMinutes <= endTotalMinutes) {
              slot.unitsPerSensorSignal = unitsPerSensorSignal;
            }
          }

          for (let minute = 0; minute < 60; minute++) {
            if (slot.downtimeStatuses[minute].status) {
              continue;
            }

            const production = productionPerMinute[slot.hour]?.[minute] || 0;
            slot.production[minute] = production;
            slot.hourlyProduction += production;
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
        });
      }

      setTimeSlots(slots);
    };

    generateTimeline();
  }, [shift, machineData, station, downtimeRecords, productRecords, oeeMetrics]);

  return (
    <div className="p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-700">
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

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs uppercase text-gray-400 font-semibold tracking-wider flex items-center gap-2">
          Production Timeline
          <div className="h-0.5 w-24 bg-green-500 rounded-full" />
        </h2>
        <span className="text-sm text-gray-400">
          {station} - {shift?.shiftName || "No Shift"}
        </span>
      </div>

      <div className="space-y-1">
        {timeSlots.map((slot) => {
          return (
            <div
              key={slot.hour}
              className="flex items-stretch h-8 bg-gray-800/50 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-16 flex items-center justify-end pr-3 text-sm font-semibold text-gray-300 tabular-nums">
                {String(slot.hour).padStart(2, "0")}:00
              </div>

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
                        ${slot.downtimeStatuses[i].status === "planned" ? "bg-[#3674B5]" : ""}
                        ${slot.downtimeStatuses[i].status === "unplanned" ? "bg-red-900" : ""}
                        ${slot.statuses[i] === "red" ? "bg-[#E52020]" : ""}
                        ${slot.statuses[i] === "green" ? "bg-[#0AAC00]" : ""}
                        ${slot.statuses[i] === "yellow" ? "bg-[#FFEB00]" : ""}
                        hover:opacity-80 transition-opacity duration-200
                      `}
                    />
                  );
                })}
              </div>

              <div className="w-24 flex items-center justify-end pl-3 text-sm font-semibold text-white tabular-nums">
                {slot.hourlyProduction !== 0 || machineData.length > 0
                  ? `${slot.hourlyProduction}/${Math.round(slot.targetQty)}`
                  : `0/${Math.round(slot.targetQty)}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}