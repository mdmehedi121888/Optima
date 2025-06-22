import {
  Plus,
  X,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Swal from "sweetalert2";
import {  UserType } from "../../../context/AuthContext";

interface StopReasonFormData {
  id?: number;
  problemGroups: string;
  problemReasons: string;
  stopTypes: string;
  oeeCalculation: string;
  stations: string;
  creator: string;
}

interface StopReason {
  id: number;
  problem_groups: string;
  problem_reasons: string;
  stop_types: string | null;
  oee_calculation: string | null;
  stations: string | null;
  is_active: number;
  creator: string;
  sys_date_time: string;
  updated_at: string | null;
}


export default function StopReason() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedStopReason, setSelectedStopReason] = useState<StopReason | null>(null);
  const { register, handleSubmit, setValue, watch, reset } = useForm<StopReasonFormData>();
  const [stopReasons, setStopReasons] = useState<StopReason[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const itemsPerPage = 10;

  const stopTypes = watch("stopTypes");

  useEffect(() => {
    if (stopTypes === "Planned") {
      setValue("oeeCalculation", "Excluded");
    }
  }, [stopTypes, setValue]);
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
    if (isEditModalOpen && selectedStopReason) {
      setValue("problemGroups", selectedStopReason.problem_groups);
      setValue("problemReasons", selectedStopReason.problem_reasons);
      setValue("stopTypes", selectedStopReason.stop_types || "");
      setValue("oeeCalculation", selectedStopReason.oee_calculation || "");
      setValue("stations", selectedStopReason.stations || "");
    } else {
      reset();
    }
  }, [isEditModalOpen, selectedStopReason, setValue, reset]);

  const fetchStopReasons = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/stopReasons", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch Stop Reasons");
      }
      const data = await response.json();
      setStopReasons(data);
    } catch (error) {
      console.error("Error fetching Stop Reasons:", error);
    }
  };

  useEffect(() => {
    fetchStopReasons();
  }, []);

  const filteredStopReasons = stopReasons.filter(
    (reason) =>
      reason.problem_reasons?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reason.problem_groups?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedStopReasons = filteredStopReasons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredStopReasons.length / itemsPerPage);

  const openAddStopReasonModal = () => {
    setSelectedStopReason(null);
    reset();
    setIsModalOpen(true);
  };

  const openEditStopReasonModal = (stopReason: StopReason) => {
    setSelectedStopReason(stopReason);
    setIsEditModalOpen(true);
  };

  const onSubmit: SubmitHandler<StopReasonFormData> = async (data) => {
    try {
      const payload = {
        ...data,
        creator: creator,
      };

      const url = selectedStopReason
        ? `http://localhost:5000/api/stopReasons/${selectedStopReason.id}`
        : "http://localhost:5000/api/stopReasons";
      const method = selectedStopReason ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        Swal.fire({
          position: "center",
          icon: "error",
          title: selectedStopReason ? "Stop Reason Update Failed!" : "Stop Reason Insert Failed!",
          showConfirmButton: false,
          timer: 2000,
        });
        return;
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: selectedStopReason ? "Stop Reason Updated Successfully!" : "Stop Reason Inserted Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedStopReason(null);
        fetchStopReasons();
        reset();
      });
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "An error occurred!",
        text: "Please try again.",
        showConfirmButton: true,
      }).then(() => {
        reset();
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedStopReason) return;

    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirmDelete.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:5000/api/stopReasons/${selectedStopReason.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete stop reason");
        }

        Swal.fire({
          title: "Deleted!",
          text: "Stop Reason has been deleted.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        setIsEditModalOpen(false);
        setSelectedStopReason(null);
        fetchStopReasons();
      } catch (error) {
        console.error("Error deleting stop reason:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to delete stop reason.",
          icon: "error",
          showConfirmButton: true,
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-4/5 p-6">
        <div className="flex justify-between items-center mb-4 max-w-[90rem] mx-auto">
          <h1 className="text-3xl font-bold">Stop Reasons</h1>
          <button
            onClick={openAddStopReasonModal}
            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition"
          >
            <Plus className="w-5 h-5 mr-2 font-bold" /> <span className="font-bold">Reason</span>
          </button>
        </div>
        <div className="mb-4 max-w-[90rem] mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by reason or group..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-7xl mx-auto overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-[#141E30] to-[#243B55] text-white uppercase text-sm tracking-wider">
                <tr>
                  <th className="p-3 text-center">Stop Reason</th>
                  <th className="p-3 text-center">Group</th>
                  <th className="p-3 text-center">Stop Types</th>
                  <th className="p-3 text-center">OEE Calculation</th>
                  <th className="p-3 text-center">Stations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {paginatedStopReasons.map((stopReason, index) => (
                  <tr
                    key={stopReason.id}
                    className={`cursor-pointer hover:bg-green-100 transition duration-200 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                    onClick={() => openEditStopReasonModal(stopReason)}
                  >
                    <td className="p-3 text-center">{stopReason.problem_reasons}</td>
                    <td className="p-3 font-semibold text-center">{stopReason.problem_groups || "-"}</td>
                    <td className="p-3 font-semibold text-center">{stopReason.stop_types || "-"}</td>
                    <td className="p-3 font-semibold text-center">{stopReason.oee_calculation || "-"}</td>
                    <td className="p-3 font-semibold text-center">{stopReason.stations || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {(isModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-md">
            <div className="bg-white p-6 rounded-xl shadow-lg w-[500px] md:w-[600px] lg:w-[900px] relative">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-2xl font-semibold">{isModalOpen ? "Add New Reason" : "Edit Reason"}</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedStopReason(null);
                    reset();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <input
                  {...register("problemReasons")}
                  placeholder="Stop Reason"
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  {...register("problemGroups")}
                  placeholder="Problem Group"
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  {...register("stopTypes")}
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Stop Type</option>
                  <option value="Planned">Planned</option>
                  <option value="Unplanned">Unplanned</option>
                </select>
                <select
                  {...register("oeeCalculation")}
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select OEE Calculation</option>
                  <option value="Included">Included</option>
                  <option value="Excluded">Excluded</option>
                </select>
                <select
                  {...register("stations")}
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Station</option>
                  <option value="Final Line">Final Line</option>
                  <option value="Internal Line">Internal Line</option>
                  <option value="External Line">External Line</option>
                  <option value="Valve Plate">Valve Plate</option>
                </select>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsEditModalOpen(false);
                      setSelectedStopReason(null);
                      reset();
                    }}
                    className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  {isEditModalOpen && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    {isModalOpen ? "Save" : "Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}