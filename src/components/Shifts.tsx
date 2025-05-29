import { useNavigate } from "react-router-dom";
import {
  User,
  Factory,
  AlertTriangle,
  Gauge,
  Trash2,
  MapPin,
  Package,
  AlignJustify,
  LaptopMinimal,
  UsersRound,
  Calendar,
  Plus,
  X,
  AlignLeft,
  EyeOff,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import SubSidebar from "./SubSidebar";
import HandleSidebar from "./HandleSidebar";
import { useForm, SubmitHandler } from "react-hook-form";
import Swal from "sweetalert2";

interface ShiftFormData {
  id: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  days: string[];
  stations: string[];
  selectAll: boolean;
}

interface Shift {
  id: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  days: string;
  stations: string;
  selectAll: boolean;
  is_active: boolean;
}

interface SettingItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

const settings: SettingItem[] = [
  {
    icon: <User size={24} className="text-yellow-500" />,
    title: "Hi, User",
    description: "Manage your basic information — name, profile picture, email, and language.",
    link: "/profile",
  },
  {
    icon: <UsersRound size={24} className="text-yellow-500" />,
    title: "Users",
    description: "Control who has access to Evocon in your company and what rights they should have.",
    link: "/settings/users",
  },
  {
    icon: <UsersRound size={24} className="text-green-500" />,
    title: "Operators",
    description: "Manage the names of your operators and the stations where they are working.",
    link: "/operators",
  },
  {
    icon: <AlertTriangle size={24} className="text-red-500" />,
    title: "Stop reasons",
    description: "Manage reasons that operators use to comment on production downtime.",
    link: "/stop-reasons",
  },
  {
    icon: <Gauge size={24} className="text-yellow-500" />,
    title: "Speed loss reasons",
    description: "Manage reasons that operators use to comment on speed loss.",
    link: "/speed-loss-reasons",
  },
  {
    icon: <Trash2 size={24} className="text-orange-500" />,
    title: "Scrap reasons",
    description: "Manage reasons that operators use to comment on quality loss.",
    link: "/scrap-reasons",
  },
  {
    icon: <MapPin size={24} className="text-red-500" />,
    title: "Locations",
    description: "Use locations to get more insight into production downtime.",
    link: "/locations",
  },
  {
    icon: <LaptopMinimal size={24} className="text-blue-500" />,
    title: "Stations",
    description: "Adjust station settings, like OEE targets, notification emails & empty shift reason.",
    link: "/stations",
  },
  {
    icon: <Package size={24} className="text-black" />,
    title: "Products",
    description: "View and manage all the products and their settings produced in your company.",
    link: "/products",
  },
  {
    icon: <Calendar size={24} className="text-black" />,
    title: "Shifts",
    description: "Define the work schedule of each station in your factory.",
    link: "/settings/shifts",
  },
];

// ✅ Define TypeScript Interface for User
interface UserType {
  id: number;
  userName: string;
  userImage: string;
  role: string;
  userId: string;
  defaultStation: string;
  stations: string;
}
export default function Shifts() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const { register, watch, handleSubmit, setValue, reset } = useForm<ShiftFormData>({
    defaultValues: {
      shiftName: "",
      startTime: "",
      endTime: "",
      days: [],
      stations: [],
      selectAll: false,
    },
  });
  const [shifts, setShifts] = useState<Shift[]>([]);
  const selectAll = watch("selectAll");
  const selectedDays = watch("days", []);
   const [user, setUser] = useState<UserType | null>(null);

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

  // Use Effect to populate form when editing
  useEffect(() => {
    if (isEditModalOpen && selectedShift) {
      setValue("shiftName", selectedShift.shiftName);
      setValue("startTime", selectedShift.startTime);
      setValue("endTime", selectedShift.endTime);
      setValue("stations", selectedShift.stations?.split(", ") || []);
      const daysArray = selectedShift.days?.split(", ") || [];
      setValue("days", daysArray);
      setValue("selectAll", daysArray.length === 7);
    } else {
      reset({
        shiftName: "",
        startTime: "",
        endTime: "",
        stations: [],
        days: [],
        selectAll: false,
      });
    }
  }, [isEditModalOpen, selectedShift, setValue, reset]);

  useEffect(() => {
    if (selectAll) {
      setValue("days", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
    } else if (selectedDays.length === 7) {
      setValue("days", []);
    }
  }, [selectAll, setValue, selectedDays]);

  const fetchShifts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/shifts", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch shifts: ${response.statusText}`);
      }
      const data = await response.json();
      setShifts(data);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const selectedStations = watch("stations", []);

  const openAddShiftModal = () => {
    setSelectedShift(null); // Clear selectedShift
    reset(); // Reset form fields
    setIsModalOpen(true);
  };

  const openEditShiftModal = (shift: Shift) => {
    setSelectedShift(shift);
    setIsEditModalOpen(true);
  };

  const onSubmit: SubmitHandler<ShiftFormData> = async (data) => {
    try {
      if (selectedShift && !selectedShift.id) {
        throw new Error("Selected shift ID is missing");
      }

      const payload = {
        ...data,
        stations: data.stations.join(", "),
        days: data.days.join(", "),
        is_active: selectedShift ? selectedShift.is_active : true, // Preserve or default is_active
        selectAll: data.selectAll,
        creator : user?.userId
      };

      console.log("Submitting payload:", payload);

      const url = selectedShift
        ? `http://localhost:5000/api/shifts/${selectedShift.id}`
        : "http://localhost:5000/api/shifts";
      const method = selectedShift ? "PUT" : "POST";

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
        console.error(`Failed to ${selectedShift ? "update" : "insert"} shift: ${response.status} - ${errorText}`);
        Swal.fire({
          position: "center",
          icon: "error",
          title: selectedShift ? "Shift Update Failed!" : "Shift Insert Failed!",
          text: `Error: ${errorText || response.statusText}`,
          showConfirmButton: true,
        });
        return;
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: selectedShift ? "Shift Updated Successfully!!" : "Shift Inserted Successfully!!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedShift(null); // Clear selectedShift after submission
        fetchShifts();
        reset();
      });
    } catch (error:any) {
      console.error("Error in onSubmit:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "An error occurred!",
        text: error.message || "Please try again.",
        showConfirmButton: true,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedShift || !selectedShift.id) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "No shift selected!",
        text: "Please select a shift to delete.",
        showConfirmButton: true,
      });
      return;
    }

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
        const response = await fetch(`http://localhost:5000/api/shifts/${selectedShift.id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to delete shift: ${response.status} - ${errorText}`);
          throw new Error(`Failed to delete shift: ${errorText || response.statusText}`);
        }

        Swal.fire({
          title: "Deleted!",
          text: "Shift has been deleted.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        setIsEditModalOpen(false);
        setSelectedShift(null); // Clear selectedShift after deletion
        fetchShifts();
      } catch (error:any) {
        console.error("Error deleting shift:", error);
        Swal.fire({
          title: "Error!",
          text: error.message || "Failed to delete shift.",
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
          <h1 className="text-3xl font-bold">Shifts</h1>
          <button
            onClick={openAddShiftModal}
            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition"
          >
            <Plus className="w-5 h-5 mr-2 font-bold" /> <span className="font-bold">SHIFT</span>
          </button>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-7xl mx-auto overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-[#141E30] to-[#243B55] text-white uppercase text-sm tracking-wider">
                <tr>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Shifts</th>
                  <th className="p-3 text-center">Stations</th>
                  <th className="p-3 text-center">Days</th>
                  <th className="p-3 text-center">Shift time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {shifts.map((shift, index) => (
                  <tr
                    key={shift.id}
                    className={`cursor-pointer hover:bg-green-100 transition duration-200 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                    onClick={() => openEditShiftModal(shift)}
                  >
                    <td className="p-3 font-semibold text-center relative flex items-center justify-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${shift.is_active ? "bg-green-500" : "bg-red-500"}`}></span>
                      <span>{shift.is_active ? "ON" : "OFF"}</span>
                    </td>
                    <td className="p-3 font-semibold text-center">{shift.shiftName}</td>
                    <td className="p-3 text-center">{shift.stations}</td>
                    <td className="p-3 font-semibold text-center">
                      {shift?.days
                        ? shift.days.split(",").length === 7
                          ? "All Week"
                          : shift.days.split(",").map((day) => day.trim().slice(0, 3)).join(", ")
                        : "No Days Selected"}
                    </td>
                    <td className="p-3 font-semibold text-center">
                      {shift.startTime}-{shift.endTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {(isModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-md">
            <div className="bg-white p-6 rounded-xl shadow-lg w-[500px] md:w-[600px] lg:w-[900px] relative">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-2xl font-semibold">{isModalOpen ? "Add New Shift" : "Edit Shift"}</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedShift(null); // Clear selectedShift  <ShiftFormData>
                    reset(); // Reset form when closing modal
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      {...register("shiftName")}
                      placeholder="Shift name"
                      className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500">
                    <h1 className="text-left font-semibold text-lg p-2">Station</h1>
                    {["Final Line", "Internal Line", "External Line", "Valve Plate"].map((station, index) => (
                      <label key={index} className="flex items-center space-x-2 px-2 py-1">
                        <input
                          type="checkbox"
                          {...register("stations")}
                          value={station}
                          className="form-checkbox text-green-500 focus:ring-green-500"
                          defaultChecked={selectedShift?.stations?.includes(station)}
                        />
                        <span>{station}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-1">
                    <label className="text-gray-700 font-medium">Start Time</label>
                    <input
                      type="time"
                      {...register("startTime")}
                      className="w-full px-4 py-2 border border-green-500 rounded-2xl bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-green-400 transition-all duration-300"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-gray-700 font-medium">End Time</label>
                    <input
                      type="time"
                      {...register("endTime")}
                      className="w-full px-4 py-2 border border-green-500 rounded-2xl bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-green-400 transition-all duration-300"
                    />
                  </div>
                </div>

                <h1 className="text-left font-semibold text-lg">Days</h1>
                <div className="w-full border border-green-500 px-4 py-2 rounded-xl flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500">
                  <label className="flex items-center space-x-2 px-2 py-1">
                    <input
                      type="checkbox"
                      {...register("selectAll")}
                      className="form-checkbox text-green-500 focus:ring-green-500"
                    />
                    <span>Select All</span>
                  </label>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => (
                    <label key={index} className="flex items-center space-x-2 px-2 py-1">
                      <input
                        type="checkbox"
                        {...register("days")}
                        value={day}
                        checked={selectAll || selectedDays.includes(day)}
                        onChange={(e) => {
                          const currentDays = selectedDays;
                          if (e.target.checked) {
                            setValue("days", [...currentDays, day]);
                          } else {
                            setValue("days", currentDays.filter((d) => d !== day));
                            setValue("selectAll", false);
                          }
                        }}
                        className="form-checkbox text-green-500 focus:ring-green-500"
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsEditModalOpen(false);
                      setSelectedShift(null); // Clear selectedShift when canceling
                      reset(); // Reset form when canceling
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