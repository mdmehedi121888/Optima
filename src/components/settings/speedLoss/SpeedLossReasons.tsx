import {
  User,
  AlertTriangle,
  Gauge,
  Trash2,
  MapPin,
  Package,
  LaptopMinimal,
  UsersRound,
  Calendar,
  Plus,
  X,
  Search,
} from "lucide-react";
import { useState, useEffect, useContext } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Swal from "sweetalert2";
import { AuthContext } from "../../../context/AuthContext";
import { availableStations } from "../../common/lib/fetchStations";

interface SpeedLossReasonFormData {
  id?: number;
  speedLossReason: string;
  speedLossGroup: string;
  stations: string[];
  selectAllStations: boolean;
  creator: string;
}

interface SpeedLossReason {
  id: number;
  speed_loss_reason: string;
  speed_loss_group: string;
  stations: string;
  is_active: number;
  creator: string;
  sys_date_time: string;
  updated_at: string | null;
}



export default function SpeedLossReasons() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedSpeedLossReason, setSelectedSpeedLossReason] = useState<SpeedLossReason | null>(null);
  const { register, handleSubmit, setValue, watch, reset } = useForm<SpeedLossReasonFormData>({
    defaultValues: {
      speedLossReason: "",
      speedLossGroup: "",
      stations: [],
      selectAllStations: false,
      creator: "",
    },
  });
  const [speedLossReasons, setSpeedLossReasons] = useState<SpeedLossReason[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const itemsPerPage = 10;

  const selectAllStations = watch("selectAllStations");
  const selectedStations = watch("stations", []);

 const auth = useContext(AuthContext);
 const creator = auth?.user?.userId;

  useEffect(() => {
    if (selectAllStations) {
      setValue("stations", availableStations);
    } else if (selectedStations.length === availableStations.length) {
      setValue("stations", []);
    }
  }, [selectAllStations, setValue]);

  useEffect(() => {
    if (isEditModalOpen && selectedSpeedLossReason) {
      setValue("speedLossReason", selectedSpeedLossReason.speed_loss_reason);
      setValue("speedLossGroup", selectedSpeedLossReason.speed_loss_group);
      const stationsArray = selectedSpeedLossReason.stations
        ? selectedSpeedLossReason.stations.split(", ").filter((s: string) => s.trim() !== "")
        : [];
      setValue("stations", stationsArray);
      setValue("selectAllStations", stationsArray.length === availableStations.length);
    } else {
      reset({
        speedLossReason: "",
        speedLossGroup: "",
        stations: [],
        selectAllStations: false,
        creator: "",
      });
    }
  }, [isEditModalOpen, selectedSpeedLossReason, setValue, reset]);

  const fetchSpeedLossReasons = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/speedLossReasons", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch Speed Loss Reasons");
      }
      const data = await response.json();
      setSpeedLossReasons(data);
    } catch (error) {
      console.error("Error fetching Speed Loss Reasons:", error);
    }
  };

  useEffect(() => {
    fetchSpeedLossReasons();
  }, []);

  const filteredSpeedLossReasons = speedLossReasons.filter(
    (reason) =>
      reason.speed_loss_reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reason.speed_loss_group?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reason.stations?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedSpeedLossReasons = filteredSpeedLossReasons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredSpeedLossReasons.length / itemsPerPage);

  const openAddSpeedLossReasonModal = () => {
    setSelectedSpeedLossReason(null);
    reset();
    setIsModalOpen(true);
  };

  const openEditSpeedLossReasonModal = (speedLossReason: SpeedLossReason) => {
    setSelectedSpeedLossReason(speedLossReason);
    setIsEditModalOpen(true);
  };

  const onSubmit: SubmitHandler<SpeedLossReasonFormData> = async (data) => {
    try {
      const payload = {
        speedLossReason: data.speedLossReason,
        speedLossGroup: data.speedLossGroup,
        stations: data.stations.join(", "),
        creator: creator,
      };

      const url = selectedSpeedLossReason
        ? `http://localhost:5000/api/speedLossReasons/${selectedSpeedLossReason.id}`
        : "http://localhost:5000/api/speedLossReasons";
      const method = selectedSpeedLossReason ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        Swal.fire({
          position: "center",
          icon: "error",
          title: selectedSpeedLossReason ? "Speed Loss Reason Update Failed!" : "Speed Loss Reason Insert Failed!",
          text: `Error: ${errorText || response.statusText}`,
          showConfirmButton: true,
        });
        return;
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: selectedSpeedLossReason ? "Speed Loss Reason Updated Successfully!" : "Speed Loss Reason Inserted Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedSpeedLossReason(null);
        fetchSpeedLossReasons();
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
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedSpeedLossReason) return;

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
        const response = await fetch(`http://localhost:5000/api/speedLossReasons/${selectedSpeedLossReason.id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to delete speed loss reason: ${errorText || response.statusText}`);
        }

        Swal.fire({
          title: "Deleted!",
          text: "Speed Loss Reason has been deleted.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        setIsEditModalOpen(false);
        setSelectedSpeedLossReason(null);
        fetchSpeedLossReasons();
      } catch (error) {
        console.error("Error deleting speed loss reason:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to delete speed loss reason.",
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
          <h1 className="text-3xl font-bold">Speed Loss Reasons</h1>
          <button
            onClick={openAddSpeedLossReasonModal}
            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition"
          >
            <Plus className="w-5 h-5 mr-2 font-bold" /> <span className="font-bold">Reason</span>
          </button>
        </div>
        <div className="mb-4 max-w-[90rem] mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by reason, group, or stations..."
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
                  <th className="p-3 text-center">Speed Loss Reason</th>
                  <th className="p-3 text-center">Group</th>
                  <th className="p-3 text-center">Stations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {paginatedSpeedLossReasons.map((reason, index) => (
                  <tr
                    key={reason.id}
                    className={`cursor-pointer hover:bg-green-100 transition duration-200 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                    onClick={() => openEditSpeedLossReasonModal(reason)}
                  >
                    <td className="p-3 text-center">{reason.speed_loss_reason}</td>
                    <td className="p-3 font-semibold text-center">{reason.speed_loss_group || "-"}</td>
                    <td className="p-3 font-semibold text-center">{reason.stations || "-"}</td>
                   
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
                <h2 className="text-2xl font-semibold">{isModalOpen ? "Add New Speed Loss Reason" : "Edit Speed Loss Reason"}</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedSpeedLossReason(null);
                    reset();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <input
                  {...register("speedLossReason")}
                  placeholder="Speed Loss Reason"
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  {...register("speedLossGroup")}
                  placeholder="Speed Loss Group"
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500">
                  <h1 className="text-left font-semibold text-lg p-2">Stations</h1>
                  <label className="flex items-center space-x-2 px-2 py-1">
                    <input
                      type="checkbox"
                      {...register("selectAllStations")}
                      className="form-checkbox text-green-500 focus:ring-green-500"
                    />
                    <span>All</span>
                  </label>
                  {availableStations.map((station, index) => (
                    <label key={index} className="flex items-center space-x-2 px-2 py-1">
                      <input
                        type="checkbox"
                        {...register("stations")}
                        value={station}
                        className="form-checkbox text-green-500 focus:ring-green-500"
                        checked={selectAllStations || selectedStations.includes(station)}
                        onChange={(e) => {
                          const currentStations = selectedStations;
                          if (e.target.checked) {
                            setValue("stations", [...currentStations, station]);
                          } else {
                            setValue("stations", currentStations.filter((s) => s !== station));
                            setValue("selectAllStations", false);
                          }
                        }}
                      />
                      <span>{station}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsEditModalOpen(false);
                      setSelectedSpeedLossReason(null);
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