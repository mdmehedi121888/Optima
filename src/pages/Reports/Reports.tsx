import { useState } from "react";
import DowntimeReports from "../../components/downtime/DowntimeReports";
import OEEReports from "./OEEReports";
import QuantitiesReports from "./QuantitiesReports";
import SpeedLossReports from "./SpeedLossRepots";

export default function Reports() {
  const [activeTab, setActiveTab] = useState<"Downtime" | "OEE" | "Quantities" | "SpeedLoss">("Downtime");

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1 p-6">
        <div className="max-w-[90rem] mx-auto">
          <h1 className="text-3xl font-bold mb-6">Reports</h1>
          <div className="flex border-b border-gray-200 mb-4">
            <button
              className={`px-4 py-2 font-semibold text-sm ${
                activeTab === "Downtime"
                  ? "border-b-2 border-green-500 text-green-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("Downtime")}
            >
              Downtime
            </button>
            <button
              className={`px-4 py-2 font-semibold text-sm ${
                activeTab === "OEE"
                  ? "border-b-2 border-green-500 text-green-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("OEE")}
            >
              OEE
            </button>
            <button
              className={`px-4 py-2 font-semibold text-sm ${
                activeTab === "Quantities"
                  ? "border-b-2 border-green-500 text-green-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("Quantities")}
            >
              Quantities
            </button>
            <button
              className={`px-4 py-2 font-semibold text-sm ${
                activeTab === "SpeedLoss"
                  ? "border-b-2 border-green-500 text-green-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("SpeedLoss")}
            >
              Speed Loss
            </button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            {activeTab === "Downtime" ? (
              <DowntimeReports />
            ) : activeTab === "OEE" ? (
              <OEEReports />
            ) : activeTab === "Quantities" ? (
              <QuantitiesReports />
            ) : (
              <SpeedLossReports />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}