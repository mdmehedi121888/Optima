import { FC, useContext, useEffect, useState } from "react";
import { Modal } from "../../common/Modal";
import { Plus, Edit, Trash } from "lucide-react";
import Swal from "sweetalert2";
import { AuthContext } from "../../../context/AuthContext";
import { locations } from "../../common/lib/fetchLocations";

interface ScrapFormData {
  id?: number;
  start_time: string;
  end_time: string;
  scrap_qty: number;
  scrap_reason: string;
  production_date: string;
  shift: string;
  station: string;
  location: string;
  creator?: string;
  is_active?: number;
  sys_date_time?: string;
  updated_at?: string | null;
}

interface ScrapRecordsModalProps {
  scrapRecords: ScrapFormData[];
  onAdd: () => void;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export const ScrapRecordsModal: FC<ScrapRecordsModalProps> = ({
  scrapRecords,
  onAdd,
  onClose,
  onUpdateSuccess,
}) => {
  const [editingRecord, setEditingRecord] = useState<ScrapFormData | null>(null);
  const [formData, setFormData] = useState<ScrapFormData>({
    start_time: "",
    end_time: "",
    scrap_qty: 0,
    scrap_reason: "",
    production_date: "",
    shift: "Day",
    station: "Final Line",
    location: "",
    creator: "",
  });
  const [scrapReasons, setScrapReasons] = useState<string[]>([]);

 const auth = useContext(AuthContext);
 const creator = auth?.user?.userId;

  useEffect(() => {
    const fetchScrapReasons = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/scrapReasons");
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

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        id: editingRecord.id,
        start_time: editingRecord.start_time,
        end_time: editingRecord.end_time,
        scrap_qty: editingRecord.scrap_qty,
        scrap_reason: editingRecord.scrap_reason,
        production_date: editingRecord.production_date.split("T")[0],
        shift: editingRecord.shift,
        station: editingRecord.station,
        location: editingRecord.location,
        creator: creator,
      });
    } else {
      setFormData({
        start_time: "",
        end_time: "",
        scrap_qty: 0,
        scrap_reason: "",
        production_date: "",
        shift: "",
        station: "",
        location: "",
        creator: "",
      });
    }
  }, [editingRecord, creator]);

  const handleEditClick = (record: ScrapFormData) => {
    setEditingRecord(record);
  };

  const handleDeleteClick = async (record: ScrapFormData) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/scrapReasons/scrap/${record.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete scrap record");
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Scrap Record Deleted Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        setEditingRecord(null);
        onUpdateSuccess();
      });
    } catch (error) {
      console.error("Error deleting scrap record:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Failed to delete scrap record. Please try again!",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "scrap_qty" ? (parseInt(value) >= 0 ? parseInt(value) : 0) : value,
    }));
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.id ||
      !formData.start_time ||
      !formData.end_time ||
      !formData.scrap_qty ||
      !formData.scrap_reason ||
      !formData.production_date ||
      !formData.location
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

    const payload = {
      startTime: formData.start_time,
      endTime: formData.end_time,
      scrapQty: formData.scrap_qty,
      scrapReason: formData.scrap_reason,
      productionDate: formData.production_date,
      shift: formData.shift,
      station: formData.station,
      location: formData.location,
      creator: creator,    
    };

    try {
      const response = await fetch(
        `http://localhost:5000/api/scrapReasons/scrap/${formData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update scrap record");
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Scrap Record Updated Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        setEditingRecord(null);
        onUpdateSuccess();
      });
    } catch (error) {
      console.error("Error updating scrap record:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Failed to update scrap record. Please try again!",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
  };

  return (
    <Modal title="Scrap Records" onClose={onClose}>
      <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-4">
        {editingRecord ? (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1">Start Time</label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">End Time</label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Scrap Quantity</label>
              <input
                type="number"
                name="scrap_qty"
                value={formData.scrap_qty}
                onChange={handleInputChange}
                className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Scrap Reason</label>
              <select
                name="scrap_reason"
                value={formData.scrap_reason}
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
                name="production_date"
                value={formData.production_date}
                onChange={handleInputChange}
                className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
           
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-2 px-5 rounded-lg transition duration-300 shadow-lg shadow-red-500/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-5 mr-3 rounded-lg transition duration-300 shadow-lg shadow-green-500/30"
              >
                Update
              </button>
            </div>
          </form>
        ) : (
          <>
            {scrapRecords.length > 0 ? (
              <ul className="space-y-4">
                {scrapRecords.map((record, index) => (
                  <li
                    key={index}
                    className="p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700 text-gray-300"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p><strong>Start Time:</strong> {record.start_time}</p>
                        <p><strong>End Time:</strong> {record.end_time}</p>
                        <p><strong>Scrap Quantity:</strong> {record.scrap_qty}</p>
                        <p><strong>Scrap Reason:</strong> {record.scrap_reason}</p>
                        <p><strong>Location:</strong> {record.location}</p>
                        <p><strong>Production Date:</strong> {record.production_date.split("T")[0]}</p>
                        
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEditClick(record)}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-1 px-3 rounded-lg transition duration-300 shadow-lg shadow-green-500/30"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record)}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-1 px-3 rounded-lg transition duration-300 shadow-lg shadow-red-500/30"
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center">No scrap records found.</p>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={onAdd}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 shadow-lg shadow-blue-500/30"
              >
                <Plus className="w-5 h-5" />
                Add Record
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};