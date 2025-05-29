"use client";

import { useEffect, useState } from "react";

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

interface BatchInfoProps {
  station: string;
  shift: string;
  productionQty: number;
}

export function BatchInfo({ station, shift, productionQty }: BatchInfoProps) {
  const [currentBatch, setCurrentBatch] = useState<string>("NA");
  const [targetQty, setTargetQty] = useState<number>(0);
  const [oee, setOee] = useState<number>(0);
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

  // Fetch product records
  const fetchProductRecords = async () => {
    try {
      if (!station || !shift) {
        setCurrentBatch("NA");
        setTargetQty(0);
        setOee(0);
        setError("Station or shift not selected");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/products/specificProductRecords?station=${encodeURIComponent(station)}&shift=${shift}`
      );
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data: ProductRecord[] = await response.json();
      // console.log("Fetched product records:", data);

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
            unitsPerSensorSignal: item.unitsPerSensorSignal ?? "",
            startTime: item.startTime ?? "",
            endTime: item.endTime ?? "",
            qty: item.qty ?? "0",
            is_active: item.is_active ?? 0,
            creator: item.creator ?? null,
            sys_date_time: item.sys_date_time ?? "",
            updated_at: item.updated_at ?? null,
          }))
        : [];

      // console.log("Mapped records:", records);

      // Determine current batch and calculate quantities
      const currentTime = new Date("2025-04-29T15:00:00"); // Mock time for testing
      let foundBatch = "NA";
      let activeProduct: ProductRecord | null = null;

      for (const record of records) {
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
            foundBatch = record.productName;
            activeProduct = record;
            break;
          }
        } catch (error) {
          console.error(`Error processing record ID ${record.id}:`, record, error);
        }
      }

      // console.log("Selected active product:", activeProduct);

      setCurrentBatch(foundBatch);

      // Calculate target quantity and OEE
      if (activeProduct) {
        const target = calculateTargetQty(activeProduct);
        setTargetQty(target);

        const oeeValue = target > 0 ? (productionQty / target) * 100 : 0;

        // console.log("production qty and target: ",productionQty,target);
        
        setOee(Number(oeeValue.toFixed(2)));

        setError(null);
      } else {
        // console.log("No active product found or invalid times");
        setTargetQty(0);
        setOee(0);
        // setError("No active product found for the current time");
      }
    } catch (error) {
      console.error("Error fetching product records:", error);
      setError("Failed to fetch product records. Check server status.");
    }
  };

  // Calculate target quantity
  const calculateTargetQty = (product: ProductRecord): number => {
    try {
      const unitsPerMinute = parseInt(product.cycleTime) / 60;

      const start = parseTime(product.startTime);
      const end = parseTime(product.endTime);
      if (!start || !end) {
        console.log(`Invalid time range for product ID ${product.id}`);
        return 0;
      }

      let startMinutes = start.getHours() * 60 + start.getMinutes();
      let endMinutes = end.getHours() * 60 + end.getMinutes();

      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
      }

      const durationMinutes = endMinutes - startMinutes;
      const target = durationMinutes * unitsPerMinute;

      // console.log(`Target quantity for product ID ${product.id}: ${target} (duration: ${durationMinutes} minutes, ${unitsPerMinute} units/minute)`);
      return target;
    } catch (error) {
      console.error("Error calculating target quantity:", error);
      return 0;
    }
  };

  useEffect(() => {
    fetchProductRecords();
    const interval = setInterval(fetchProductRecords, 60000);
    return () => clearInterval(interval);
  }, [station, shift]);

  return (
    <div className="p-6 bg-gray-900 rounded-xl flex-1 shadow-lg border border-gray-700 space-y-6">
     
     
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg flex items-center gap-2 animate-pulse">
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

      {/* Shift Quantity Section */}
      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-600 hover:shadow-xl transition-shadow duration-300">
        <h2 className="text-xs uppercase text-gray-400 font-semibold tracking-wider mb-2">
          Shift Quantity
        </h2>
        <div className="flex justify-between items-center">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-white tabular-nums tracking-tight">
              {productionQty}
            </span>
            <span className="text-lg text-gray-400">
              / {targetQty.toFixed(2)} pcs
            </span>
          </div>
          <div className="text-right">
            <span className="block text-xs uppercase text-gray-400 font-semibold tracking-wider">
              OEE
            </span>
            <span className="text-4xl font-extrabold text-green-400 tabular-nums">
              {((productionQty/targetQty)*100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Current Batch Section */}
      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-600 hover:shadow-xl transition-shadow duration-300">
        <h2 className="text-xs uppercase text-gray-400 font-semibold tracking-wider mb-2 flex items-center gap-2">
          Current Batch
          <div className="h-0.5 w-24 bg-green-500 rounded-full" />
        </h2>
        <div className="text-2xl font-bold text-white tracking-tight">
          {currentBatch}
        </div>
      </div>
      
    </div>
  );
}