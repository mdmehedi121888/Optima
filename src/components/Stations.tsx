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
  Plus, X,
  AlignLeft,
  EyeOff,
  Eye
} from "lucide-react";
import { useState,useEffect  } from "react";
import Sidebar from "./Sidebar";
import SubSidebar from "./SubSidebar";
import HandleSidebar from "./HandleSidebar";
import { useForm,SubmitHandler } from "react-hook-form";
import Swal from "sweetalert2";


interface StationFormData {
  id: number;
  stations: string[];
  stationsGroup: string;
  emptyShiftReason: string;
  requireOperator: string;
  unhappyOee: string;
  happyOee: string;
  }

  
interface Station {
  id: number;
  stations: string;
  stationsGroup: string;
  emptyShiftReason: string;
  requireOperator: string;
  unhappyOee: string;
  happyOee: string;
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
  

export default function Stations() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedStation, setselectedStation] = useState<Station | null>(null);
  const { register,watch, handleSubmit, setValue, reset } = useForm<StationFormData>();
  const [stations, setStations] = useState<Station[]>([]);



// Use Effect to populate form when editing
useEffect(() => {
    if (isEditModalOpen && selectedStation) {
      setValue("stations", selectedStation.stations?.split(", ") || []);
      setValue("stationsGroup", selectedStation.stationsGroup);
      setValue("emptyShiftReason", selectedStation.emptyShiftReason);
      setValue("requireOperator", selectedStation.requireOperator);
      setValue("unhappyOee", selectedStation.unhappyOee);
      setValue("happyOee", selectedStation.happyOee);


    } else {
      reset(); // Clear form when adding a new Station
    }
  }, [isEditModalOpen, selectedStation, setValue, reset]);


  const fetchStations = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/stations", {
        method: "GET",
        credentials: "include", // ✅ Include cookies for session authentication
      });        if (!response.ok) {
            throw new Error("Failed to fetch Stations");
        }
        const data = await response.json();
        setStations(data); 
    } catch (error) {
        console.error("Error fetching Stations:", error);
    }
};

// Call fetchStations inside useEffect on component mount
useEffect(() => {
    fetchStations();
}, []);

  

  const selectedStations = watch("stations", []); 

  const openAddStationModal = () => {
    setIsModalOpen(true);
  };

  const openEditStationModal = (station: Station) => {
    setselectedStation(station);
    setIsEditModalOpen(true);
  };

  const onSubmit: SubmitHandler<StationFormData> = async (data) => {
    try {
        // ✅ Prepare the payload with additional data
        const payload = {
            ...data,
            stations: data.stations?.join(", ") || "",
        };

        const url = selectedStation 
            ? `http://localhost:5000/api/stations/${selectedStation.id}` 
            : "http://localhost:5000/api/stations";
        const method = selectedStation ? "PUT" : "POST";

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
                title: selectedStation ? "Station Update Failed!" : "Station Insert Failed!",
                showConfirmButton: false,
                timer: 2000,
            });
            return;
        }

        Swal.fire({
            position: "center",
            icon: "success",
            title: selectedStation ? "Station Updated Successfully!!" : "Station Inserted Successfully!!",
            showConfirmButton: false,
            timer: 2000,
        }).then(() => {
            setIsModalOpen(false);
            setIsEditModalOpen(false);
            fetchStations();
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

    // reset();
};

 const handleDelete = async () => {
      if (!selectedStation) return;
  
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
          const response = await fetch(`http://localhost:5000/api/stations/${selectedStation.id}`, {
            method: "DELETE",
          });
  
          if (!response.ok) {
            throw new Error("Failed to delete station");
          }
  
          Swal.fire({
            title: "Deleted!",
            text: "Station has been deleted.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
  
          setIsEditModalOpen(false);
          fetchStations();
        } catch (error) {
          console.error("Error deleting shift:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to delete stations.",
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
              <h1 className="text-3xl font-bold">Stations</h1>
              <button onClick={openAddStationModal} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition">
                <Plus className="w-5 h-5 mr-2 font-bold" /> <span className="font-bold">Station</span>
              </button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-7xl mx-auto overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden">
            {/* Table Header */}
            <thead className="bg-gradient-to-r from-[#141E30] to-[#243B55] text-white uppercase text-sm tracking-wider">
                <tr>
                <th className="p-3 text-center">Station Name</th>
                <th className="p-3 text-center">Group</th>
                <th className="p-3 text-center">Empty Shift Reason</th>
                <th className="p-3 text-center">Require Operator</th>
                <th className="p-3 text-center">Unhappy OEE</th>
                <th className="p-3 text-center">Happy OEE</th>
                </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200 text-gray-700">
                {stations.map((station, index) => (
                <tr 
                    key={station.id} 
                    className={`cursor-pointer hover:bg-green-100 transition duration-200 ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                    onClick={() => openEditStationModal(station)}
                >
                    <td className="p-3 text-center">{station.stations}</td>
                    <td className="p-3 font-semibold text-center">{station.stationsGroup?station.stationsGroup:'-'}</td>
                    <td className="p-3 font-semibold text-center">{station.emptyShiftReason?station.emptyShiftReason:'-'}</td>
                    <td className="p-3 font-semibold text-center">{station.requireOperator?station.requireOperator:'-'}</td>
                    <td className="p-3 font-semibold text-center">{station.unhappyOee}%</td>
                    <td className="p-3 font-semibold text-center">{station.happyOee}%</td>

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
                    <h2 className="text-2xl font-semibold">{isModalOpen ? "Add New Station" : "Edit Station"}</h2>
                    <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="text-gray-500 hover:text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                  <div className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500">
                    <h1 className="text-left font-semibold text-lg p-2">Station</h1>

                    {["Final Line", "Internal Line", "External Line", "Valve Plate"].map((station, index) => (
                    <label key={index} className="flex items-center space-x-2 px-2 py-1">
                        <input
                        type="checkbox"
                        {...register("stations")}
                        value={station}
                        className="form-checkbox text-green-500 focus:ring-green-500"
                        defaultChecked={selectedStation?.stations?.includes(station)}
                        />
                        <span>{station}</span>
                    </label>
                    ))}

                </div>
                  <input {...register("stationsGroup")} placeholder="station Group" className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"/>
                  <input {...register("requireOperator")} placeholder="Require Operator" className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"/>
                    <input {...register("emptyShiftReason")} placeholder="Empty Shift Reason" className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"/>
                    <input {...register("unhappyOee")} placeholder="Unhappy OEE" className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"/>
                    <input {...register("happyOee")} placeholder="Happy OEE" className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"/>
                    <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setIsEditModalOpen(false);
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
