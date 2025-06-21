import { FC, useContext, useEffect, useState } from "react";
import { Modal } from "../common/Modal";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";
import { locations } from "../common/lib/fetchLocations";

interface Product {
  id: number;
  productName: string;
  productCode: string;
  productGroup: string;
  cycleTime: string;
  unitsPerSensorSignal: string;
}

interface DowntimeFormData {
  productId?: string;
  startTime: string;
  endTime: string;
  problem_group: string;
  problem_name: string;
  location: string;
  planned_status: "planned" | "unplanned";
}

interface DowntimeModalProps {
  stations: string;
  shift: { shiftName: string } | null;
  products: Product[];
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export const DowntimeModal: FC<DowntimeModalProps> = ({
  stations,
  shift,
  products,
  onClose,
  onSubmitSuccess,
}) => {
  const [formData, setFormData] = useState<DowntimeFormData>({
    startTime: "",
    endTime: "",
    problem_group: "",
    problem_name: "",
    location: "",
    planned_status: "planned",
  });
  const [problemGroups, setProblemGroups] = useState<string[]>([]);
  const [problemReasons, setProblemReasons] = useState<string[]>([]);
  
  
  const auth = useContext(AuthContext);

  const creator = auth?.user?.userId;

  useEffect(() => {
    const fetchProblemGroups = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/downtimeProblem");
        if (!response.ok) throw new Error("Failed to fetch problem groups");
        const data = await response.json();
        const groups = data.map((item: any) => item.problem_groups).filter(Boolean);
        setProblemGroups(groups);
      } catch (error) {
        console.error("Error fetching problem groups:", error);
      }
    };
    fetchProblemGroups();
  }, []);

  useEffect(() => {
    const fetchProblemReasons = async () => {
      if (formData.problem_group) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/downtimeProblem/specific?problem=${formData.problem_group}`
          );
          if (!response.ok) throw new Error("Failed to fetch problem reasons");
          const data = await response.json();
          const reasons = data.map((item: any) => item.problem_reasons).filter(Boolean);
          setProblemReasons(reasons);
        } catch (error) {
          console.error("Error fetching problem reasons:", error);
        }
      } else {
        setProblemReasons([]);
      }
    };
    fetchProblemReasons();
  }, [formData.problem_group]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "problem_group" ? { problem_name: "" } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.productId ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.problem_group ||
      !formData.problem_name ||
      !formData.location ||
      !formData.planned_status ||
      !creator
    ) {
      Swal.fire({
        position: "center",
        icon: "warning",
        title: "Please fill in all fields and ensure you are logged in.",
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    const selectedProduct = products.find((p) => p.id === parseInt(formData.productId!));
    if (!selectedProduct) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Invalid product selected.",
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    const payload = {
      productName: selectedProduct.productName,
      productCode: selectedProduct.productCode,
      productGroup: selectedProduct.productGroup,
      station: stations,
      productionDate: new Date().toISOString().slice(0, 10),
      shift: shift?.shiftName || "",
      cycleTime: selectedProduct.cycleTime,
      unitsPerSensorSignal: selectedProduct.unitsPerSensorSignal,
      startTime: formData.startTime,
      endTime: formData.endTime,
      problem_group: formData.problem_group,
      problemReason: formData.problem_name,
      location: formData.location,
      planned_status: formData.planned_status,
      creator: creator,
    };

    // console.log("Sending create request with payload:", payload);
    try {
      const response = await fetch("http://localhost:5000/api/downtimeProblem/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create downtime record");
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Downtime Record Created Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        onSubmitSuccess();
        onClose();
      });
    } catch (error) {
      console.error("Error creating downtime record:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Failed to create downtime record. Please try again!",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  return (
    creator ?  ( <Modal title="Create Downtime Record" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-1">Product</label>
          <select
            name="productId"
            value={formData.productId || ""}
            onChange={handleInputChange}
            className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.productName} ({product.productCode})
              </option>
            ))}
          </select>
        </div>
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
        <div>
          <label className="block text-gray-300 mb-1">Problem Group</label>
          <select
            name="problem_group"
            value={formData.problem_group}
            onChange={handleInputChange}
            className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select a problem group</option>
            {problemGroups.map((group, index) => (
              <option key={index} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-300 mb-1">Problem Reason</label>
          <select
            name="problem_name"
            value={formData.problem_name}
            onChange={handleInputChange}
            className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={!formData.problem_group}
          >
            <option value="">Select a problem reason</option>
            {problemReasons.map((reason, index) => (
              <option key={index} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-300 mb-1">Location</label>
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
        <div className="flex justify-end gap-3">
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
    </Modal>):(
      <h1>Loading.......</h1>
    )
   
  );
};