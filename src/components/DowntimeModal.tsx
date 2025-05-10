// DowntimeModal.tsx
import { FC, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "./Modal";

// Define Shift interface
interface Shift {
  shiftName: string;
}

interface Product {
  productName: string;
  productCode: string;
  productGroup: string;
  cycleTime: string;
  unitsPerSensorSignal: string;
}

interface ProblemGroup {
  problem_groups: string;
}

interface ProblemReason {
  problem_reasons: string;
}

interface DowntimeFormData {
  startTime: string;
  endTime: string;
  problemGroup: string;
  problemReason: string;
  location: string;
  planned_status: "planned" | "unplanned";
}

interface DowntimeModalProps {
  stations: string;
  shift: Shift | null;
  products: Product[];
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export const DowntimeModal: FC<DowntimeModalProps> = ({ stations, shift, products, onClose, onSubmitSuccess }) => {
  const [formData, setFormData] = useState<DowntimeFormData>({
    startTime: "",
    endTime: "",
    problemGroup: "",
    problemReason: "",
    location: "",
    planned_status: "planned",
  });
  const [problemGroups, setProblemGroups] = useState<ProblemGroup[]>([]);
  const [problemReasons, setProblemReasons] = useState<ProblemReason[]>([]);
  const locations = [
    "QC রিলেটেড",
    "R&D ট্রায়াল রিলেটেড",
    "ইলেকট্রনিক্স ও মেকানিকাল মেইনটেন্যান্স",
    "মেকানিকাল মেইনটেন্যান্স",
    "QC ও R&D ট্রায়াল রিলেটেড",
    "প্রোডাকশন রিলেটেড",
    "ইউটিলিটি",
    "ডাই মেইনটেন্যান্স",
  ];

  // Fetch problem groups
  useEffect(() => {
    const fetchProblemGroups = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/downtimeProblem");
        if (!response.ok) throw new Error("Failed to fetch problem groups");
        const data = await response.json();
        setProblemGroups(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching problem groups:", error);
      }
    };
    fetchProblemGroups();
  }, []);

  // Fetch problem reasons
  useEffect(() => {
    const fetchProblemReasons = async () => {
      if (!formData.problemGroup) {
        setProblemReasons([]);
        return;
      }
      try {
        const response = await fetch(
          `http://localhost:5000/api/downtimeProblem/specific?problem=${encodeURIComponent(formData.problemGroup)}`
        );
        if (!response.ok) throw new Error("Failed to fetch problem reasons");
        const data = await response.json();
        setProblemReasons(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching problem reasons:", error);
      }
    };
    fetchProblemReasons();
  }, [formData.problemGroup]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.startTime ||
      !formData.endTime ||
      !formData.problemGroup ||
      !formData.problemReason ||
      !formData.planned_status
    ) {
      Swal.fire({
        position: "center",
        icon: "warning",
        title: "Please fill in all fields.",
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    try {
      if (!products.length) {
        Swal.fire({
          position: "center",
          icon: "warning",
          title: "No products available. Please select a product first.",
          showConfirmButton: false,
          timer: 2000,
        });
        return;
      }

      const payload = {
        ...formData,
        station: stations,
        shift: shift?.shiftName || "",
        productName: products[0]?.productName || "",
        productCode: products[0]?.productCode || "",
        productGroup: products[0]?.productGroup || "",
        productionDate: new Date().toISOString().split("T")[0],
        cycleTime: products[0]?.cycleTime || "",
        unitsPerSensorSignal: products[0]?.unitsPerSensorSignal || "",
      };

      const response = await fetch("http://localhost:5000/api/downtimeProblem/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save downtime data");

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Downtime Saved Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        onSubmitSuccess();
        onClose();
      });
    } catch (error) {
      console.error("Error saving downtime data:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Failed to save downtime data. Please try again!",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  return (
    <Modal title="Add Downtime" onClose={onClose}>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-gray-300 mb-1">Start Time</label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleInputChange}
            className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-1">End Time</label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleInputChange}
            className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-gray-300 mb-1">Groups</label>
            <select
              name="problemGroup"
              value={formData.problemGroup}
              onChange={handleInputChange}
              className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select a group</option>
              {problemGroups.map((group, index) => (
                <option key={index} value={group.problem_groups}>
                  {group.problem_groups}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Reasons</label>
            <select
              name="problemReason"
              value={formData.problemReason}
              onChange={handleInputChange}
              className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={!formData.problemGroup}
            >
              <option value="">Select a reason</option>
              {problemReasons.map((reason, index) => (
                <option key={index} value={reason.problem_reasons}>
                  {reason.problem_reasons}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Locations</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select a location</option>
              {locations.map((location, index) => (
                <option key={index} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center text-gray-300">
            <input
              type="radio"
              name="planned_status"
              value="planned"
              checked={formData.planned_status === "planned"}
              onChange={handleInputChange}
              className="mr-2 text-green-500 focus:ring-green-500"
            />
            Planned
          </label>
          <label className="flex items-center text-gray-300">
            <input
              type="radio"
              name="planned_status"
              value="unplanned"
              checked={formData.planned_status === "unplanned"}
              onChange={handleInputChange}
              className="mr-2 text-green-500 focus:ring-green-500"
            />
            Unplanned
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-2 px-5 rounded-lg transition duration-300 shadow-lg shadow-red-500/30"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-5 rounded-lg transition duration-300 shadow-lg shadow-green-500/30"
          >
            Submit
          </button>
        </div>
      </form>
    </Modal>
  );
};