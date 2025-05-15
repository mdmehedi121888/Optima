"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface ChartData {
  time: string;
  value: number;
  target: number;
}

export function PerformanceChart() {
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    // Initial data
    const generateData = () => {
      const now = new Date();
      const data: ChartData[] = [];
      for (let i = 45; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000);
        data.push({
          time: time.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          value: Math.floor(Math.random() * 300) + 100,
          target: 200,
        });
      }
      return data;
    };

    setData(generateData());

    // Update every 60 seconds
    const interval = setInterval(() => {
      setData((prev) => {
        const now = new Date();
        const newData = [
          ...prev.slice(1),
          {
            time: now.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            value: Math.floor(Math.random() * 300) + 100,
            target: 200,
          },
        ];
        return newData;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-700">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-white tabular-nums tracking-tight">
            21%
          </span>
          <span className="text-lg text-gray-400">OEE (Target: 60%)</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex flex-col items-center">
            <span className="text-gray-400 font-semibold uppercase tracking-wider">
              pcs/h
            </span>
            <div className="h-0.5 w-12 bg-green-500 rounded-full mt-1" />
          </div>
          <span className="text-gray-400 font-semibold uppercase tracking-wider">
            OEE
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-gray-800/50 rounded-lg p-4 hover:shadow-xl transition-shadow duration-300 overflow-x-hidden">
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
          width={1000}
          height={250}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#4B5563" // gray-600
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF" // gray-400
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            tickSize={8}
            tickMargin={8}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            domain={[0, 600]}
            ticks={[0, 100, 200, 300, 400, 500, 600]}
            tickSize={8}
            tickMargin={8}
          />
          <Line
            type="stepAfter"
            dataKey="value"
            stroke="#FFFFFF" // white
            dot={false}
            strokeWidth={2}
            activeDot={{ r: 6, fill: "#10B981" }} // green-500
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#6B7280" // gray-500
            strokeDasharray="5 5"
            dot={false}
            strokeWidth={1}
          />
        </LineChart>
      </div>
      
    </div>
  );
}