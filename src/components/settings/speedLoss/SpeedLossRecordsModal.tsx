import { FC, useEffect, useState } from "react";
import { Modal } from "../../common/Modal";
import { Plus, Edit, Trash } from "lucide-react";
import Swal from "sweetalert2";
import { UserType } from "../../../context/AuthContext";
import { locations } from "../../common/lib/fetchLocations";

interface SpeedLossFormData {
  id?: number;
  start_time: string;
  end_time: string;
  speed_loss_reason: string;
  production_date: string;
  shift: string;
  station: string;
  location: string;
  creator?: string;
  is_active?: number;
  sys_date_time?: string;
  updated_at?: string | null;
}

interface SpeedLossRecordsModalProps {
  speedLossRecords: SpeedLossFormData[];
  onAdd: () => void;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export const SpeedLossRecordsModal: FC<SpeedLossRecordsModalProps> = ({
  speedLossRecords,
  onAdd,
  onClose,
  onUpdateSuccess,
}) => {
  const [editingRecord, setEditingRecord] = useState<SpeedLossFormData | null>(null);
  const [formData, setFormData] = useState<SpeedLossFormData>({
    start_time: "",
    end_time: "",
    speed_loss_reason: "",
    production_date: "",
    shift: "",
    station: "",
    location: "",
    creator: "",
  });
  const [speedLossReasons, setSpeedLossReasons] = useState<string[]>([]);
  const [user, setUser] = useState<UserType | null>(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/check-session', {
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

  useEffect(() => {
    const fetchSpeedLossReasons = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/speedLossReasons");
        if (!response.ok) throw new Error("Failed to fetch speed loss reasons");
        const data = await response.json();
        const reasons = data.map((item: any) => item.speed_loss_reason).filter(Boolean);
        setSpeedLossReasons(reasons);
      } catch (error) {
        console.error("Error fetching speed loss reasons:", error);
      }
    };
    fetchSpeedLossReasons();
  }, []);

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        id: editingRecord.id,
        start_time: editingRecord.start_time,
        end_time: editingRecord.end_time,
        speed_loss_reason: editingRecord.speed_loss_reason,
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
        speed_loss_reason: "",
        production_date: "",
        shift: "",
        station: "",
        location: "",
        creator: "",
      });
    }
  }, [editingRecord, creator]);

  const handleEditClick = (record: SpeedLossFormData) => {
    setEditingRecord(record);
  };

  const handleDeleteClick = async (record: SpeedLossFormData) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/speedLossReasons/speedLossRecords/${record.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete speed loss record");
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Speed Loss Record Deleted Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        setEditingRecord(null);
        onUpdateSuccess();
      });
    } catch (error) {
      console.error("Error deleting speed loss record:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Failed to delete speed loss record. Please try again!",
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
      [name]: value,
    }));
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.id ||
      !formData.start_time ||
      !formData.end_time ||
      !formData.speed_loss_reason ||
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
      speedLossReason: formData.speed_loss_reason,
      productionDate: formData.production_date,
      shift: formData.shift,
      station: formData.station,
      location: formData.location,
      creator: creator,    
    };

    try {
      const response = await fetch(
        `http://localhost:5000/api/speedLossReasons/speedLossRecords/${formData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update speed loss record");
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Speed Loss Record Updated Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        setEditingRecord(null);
        onUpdateSuccess();
      });
    } catch (error) {
      console.error("Error updating speed loss record:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Failed to update speed loss record. Please try again!",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
  };

  return (
    <Modal title="Speed Loss Records" onClose={onClose}>
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
              <label className="block text-gray-300 mb-1">Speed Loss Reason</label>
              <select
                name="speed_loss_reason"
                value={formData.speed_loss_reason}
                onChange={handleInputChange}
                className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select a speed loss reason</option>
                {speedLossReasons.map((reason, index) => (
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
            {speedLossRecords.length > 0 ? (
              <ul className="space-y-4">
                {speedLossRecords.map((record, index) => (
                  <li
                    key={index}
                    className="p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700 text-gray-300"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p><strong>Start Time:</strong> {record.start_time}</p>
                        <p><strong>End Time:</strong> {record.end_time}</p>
                        <p><strong>Speed Loss Reason:</strong> {record.speed_loss_reason}</p>
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
              <p className="text-gray-400 text-center">No speed loss records found.</p>
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