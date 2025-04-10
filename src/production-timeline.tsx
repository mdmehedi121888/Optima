"use client";

import { useEffect, useState } from "react";

interface TimeSlot {
  hour: number;
  status: "red" | "green" | "yellow" | "none";
  markers: boolean[];
}

export function ProductionTimeline() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    // Generate initial timeline data
    const generateTimeline = () => {
      const slots: TimeSlot[] = [];
      for (let hour = 6; hour <= 13; hour++) {
        slots.push({
          hour,
          status: hour === 11 ? "green" : "red",
          markers: Array(15)
            .fill(false)
            .map(() => Math.random() > 0.7),
        });
      }
      return slots;
    };

    setTimeSlots(generateTimeline());

    // Update every 15 seconds
    const interval = setInterval(() => {
      setTimeSlots((prev) => {
        const newSlots = [...prev];
        const currentHour = new Date().getHours();
        const currentSlot = newSlots.find((slot) => slot.hour === currentHour);
        if (currentSlot) {
          currentSlot.markers = Array(15)
            .fill(false)
            .map(() => Math.random() > 0.7);
        }
        return newSlots;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-px pt-10">
      {timeSlots.map((slot) => (
        <div key={slot.hour} className="flex items-stretch h-8">
          <div className="w-8 flex items-center justify-end pr-2 text-sm tabular-nums">
            {String(slot.hour).padStart(2, "0")}
          </div>
          <div className="flex-1 grid grid-cols-15 gap-px bg-gray-800">
            {Array(15)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className={`relative ${
                    slot.status === "red"
                      ? "bg-red-600"
                      : slot.status === "green"
                      ? "bg-green-600"
                      : slot.status === "yellow"
                      ? "bg-yellow-500"
                      : "bg-transparent"
                  }`}
                >
                  {slot.markers[i] && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg rounded-full" />
                  )}
                </div>
              ))}
          </div>
          <div className="w-16 flex items-center justify-end pl-2 text-sm tabular-nums">
            {slot.hour === 10 && (
              <span className="text-red-500">31.22/250</span>
            )}
            {slot.hour === 11 && (
              <span className="text-green-500">281.79/221.81</span>
            )}
            {(slot.hour === 12 || slot.hour === 13) && (
              <span className="text-red-500">0/0</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
