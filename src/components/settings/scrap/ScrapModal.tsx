import { FC, useEffect, useState } from "react";
import { Modal } from "../../common/Modal";
import Swal from "sweetalert2";
import {  UserType } from "../../../context/AuthContext";
import { locations } from "../../common/lib/fetchLocations";


interface ScrapFormData {
  startTime: string;
  endTime: string;
  scrapQty: string;
  scrapReason: string;
  productionDate: string;
  shift: string;
  station: string;
  location: string;
  creator: string;
}

interface ScrapModalProps {
  stations: string;
  shift: { shiftName: string } | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export const ScrapModal: FC<ScrapModalProps> = ({
  stations,
  shift,
  onClose,
  onSubmitSuccess,
}) => {
  const [user, setUser] = useState<UserType | null>(null);
    
      useEffect(() => {
        const fetchUser = async () => {
          try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/check-session`, {
              credentials: 'include',
            });
            const data = await response.json();
            if (data.isAuthenticated) {
              setUser(data.user as UserType);
            }
          } catch (error) {
            console.error('Error fetching user session:', error);
          }
        };
    
        fetchUser();
      }, []);
  const creator = user?.userId;
  const [formData, setFormData] = useState<ScrapFormData>({
    startTime: "",
    endTime: "",
    scrapQty: "",
    scrapReason: "",
    productionDate: new Date().toISOString().slice(0, 10),
    shift: shift?.shiftName || "",
    station: stations,
    location: "",
    creator: "",
  });
  const [scrapReasons, setScrapReasons] = useState<string[]>([]);


  useEffect(() => {
    const fetchScrapReasons = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/scrapReasons`);
        if (!response.ok) throw new Error("Failed to fetch scrap reasons");
        const data = await response.json();
        const reasons = data.map((item: any) => item.scrap_reason).filter(Boolean);
        setScrapReasons(reasons);
      } catch (error) {
        console.error("Error fetching scrap reasons:", error);
      }
    };
    fetchScrapReasons();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "scrapQty" ? (parseInt(value) >= 0 ? value : "0") : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.startTime ||
      !formData.endTime ||
      !formData.scrapQty ||
      !formData.scrapReason ||
      !formData.productionDate ||
      !formData.shift ||
      !formData.station ||
      !formData.location ||
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

    const payload = {
      startTime: formData.startTime,
      endTime: formData.endTime,
      scrapQty: formData.scrapQty,
      scrapReason: formData.scrapReason,
      productionDate: formData.productionDate,
      shift: formData.shift,
      station: formData.station,
      location: formData.location,
      creator: creator,
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/scrapReasons/scrap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create scrap record");
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Scrap Record Created Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        onSubmitSuccess();
        onClose();
      });
    } catch (error) {
      console.error("Error creating scrap record:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Failed to create scrap record. Please try again!",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  return (
    <Modal title="Create Scrap Record" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-gray-300 mb-1">Scrap Quantity</label>
          <input
            type="number"
            name="scrapQty"
            value={formData.scrapQty}
            onChange={handleInputChange}
            className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            min=""
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-1">Scrap Reason</label>
          <select
            name="scrapReason"
            value={formData.scrapReason}
            onChange={handleInputChange}
            className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select a scrap reason</option>
            {scrapReasons.map((reason, index) => (
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
        <div>
          <label className="block text-gray-300 mb-1">Production Date</label>
          <input
            type="date"
            name="productionDate"
            value={formData.productionDate}
            onChange={handleInputChange}
            className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
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
    </Modal>
  );
};