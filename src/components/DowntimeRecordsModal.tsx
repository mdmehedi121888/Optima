import { FC, useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Plus, Edit, Trash } from "lucide-react";
import Swal from "sweetalert2";

interface UserType {
  id: number;
  userName: string;
  userImage: string;
  role: string;
  userId: string;
  defaultStation: string;
  stations: string;
}

interface Product {
  id: number;
}

interface DowntimeFormData {
  id?: number;
  productId?: string;
  startTime: string;
  endTime: string;
  problem_group: string;
  problem_name: string;
  location: string;
  planned_status: "planned" | "unplanned";
}

interface DowntimeRecordsModalProps {
  downtimeRecords: DowntimeFormData[];
  onAdd: () => void;
  onClose: () => void;
  onUpdateSuccess: () => void;
  stations?: string;
  shift?: { shiftName: string } | null;
  products: Product[];
}

export const DowntimeRecordsModal: FC<DowntimeRecordsModalProps> = ({
  downtimeRecords,
  onAdd,
  onClose,
  onUpdateSuccess,
  stations,
  shift,
  products,
}) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [editingRecord, setEditingRecord] = useState<DowntimeFormData | null>(null);
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/check-session", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.isAuthenticated) {
          setUser(data.user as UserType);
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
      }
    };

    fetchUser();
  }, []);

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

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        id: editingRecord.id,
        productId: editingRecord.productId,
        startTime: editingRecord.startTime,
        endTime: editingRecord.endTime,
        problem_group: editingRecord.problem_group,
        problem_name: editingRecord.problem_name,
        location: editingRecord.location,
        planned_status: editingRecord.planned_status,
      });
    } else {
      setFormData({
        startTime: "",
        endTime: "",
        problem_group: "",
        productId: "",
        problem_name: "",
        location: "",
        planned_status: "planned",
      });
    }
  }, [editingRecord]);

  const handleEditClick = (record: DowntimeFormData) => {
    setEditingRecord(record);
  };
  const handleDeleteClick = async (record: DowntimeFormData) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/downtimeProblem/delete/${record.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete downtime record");
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Downtime Record Delete Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        setEditingRecord(null);
        onUpdateSuccess();
      });
    } catch (error) {
      console.error("Error deleting downtime record:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Failed to delete downtime record. Please try again!",
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
      ...(name === "problem_group" ? { problem_name: "" } : {}),
    }));
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.id ||
      // !formData.productId ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.problem_group ||
      !formData.problem_name ||
      !formData.location ||
      !formData.planned_status
    ) {
      Swal.fire({
        position: "center",
        icon: "warning",
        title: "Please fill in all fields, including a valid record ID and product.",
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    const payload = {
      startTime: formData.startTime,
      endTime: formData.endTime,
      problem_group: formData.problem_group,
      problemReason: formData.problem_name,
      location: formData.location,
      planned_status: formData.planned_status,
      creator: user?.userId,
    };

    // console.log("Sending update request with formData:", formData);
    try {
      const response = await fetch(
        `http://localhost:5000/api/downtimeProblem/update/${formData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update downtime record");
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Downtime Record Updated Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        setEditingRecord(null);
        onUpdateSuccess();
      });
    } catch (error) {
      console.error("Error updating downtime record:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Failed to update downtime record. Please try again!",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
  };

  return (
    <Modal title="Downtime Records" onClose={onClose}>
      <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-4">
        {editingRecord ? (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            
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
            {downtimeRecords.length > 0 ? (
              <ul className="space-y-4">
                {downtimeRecords.map((record, index) => (
                  <li
                    key={index}
                    className="p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700 text-gray-300"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p><strong>Start Time:</strong> {record.startTime}</p>
                        <p><strong>End Time:</strong> {record.endTime}</p>
                        <p><strong>Problem Group:</strong> {record.problem_group}</p>
                        <p><strong>Problem Reason:</strong> {record.problem_name}</p>
                        <p><strong>Location:</strong> {record.location}</p>
                        <p><strong>Status:</strong> {record.planned_status}</p>
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
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-1 px-3 rounded-lg transition duration-300 shadow-lg shadow-yellow-500/30"
                      >
                        <Trash className="w-5 h-5" />
                        
                      </button>
                      </div>
                      
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center">No downtime records found.</p>
            )}
            <div className="flex justify-end mt-4 mr-3">
              <button
                onClick={onAdd}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 px-5 rounded-lg transition duration-300 shadow-lg shadow-blue-500/30"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};