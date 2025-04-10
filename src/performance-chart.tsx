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

    // Update every 15 seconds
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
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full pt-2">
      <div className="flex justify-between items-start mb-2 ml-5">
        {/* <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold tabular-nums">21%</span>
          <span className="text-gray-400">OEE (60%)</span>
        </div> */}
        <div className="flex items-left gap-8 text-sm">
          <span className="text-gray-400 text-base ">
            pcs/h
            <hr></hr>
          </span>
          <span className="text-gray-400 ">OEE</span>
        </div>
      </div>
      <div className="h-[180px] -ml-4">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
          width={1000}
          height={250}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#666"
            tick={{ fill: "#666", fontSize: 12 }}
            tickSize={8}
            tickMargin={8}
          />
          <YAxis
            stroke="#666"
            tick={{ fill: "#666", fontSize: 12 }}
            domain={[0, 600]}
            ticks={[0, 100, 200, 300, 400, 500, 600]}
            tickSize={8}
            tickMargin={8}
          />
          <Line
            type="stepAfter"
            dataKey="value"
            stroke="#fff"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#666"
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </div>
    </div>
  );
}
