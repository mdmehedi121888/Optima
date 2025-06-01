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
import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Swal from "sweetalert2";

interface LocationFormData {
  id?: number;
  location: string;
  stations: string[];
  selectAllStations: boolean;
  creator: string;
}

interface Location {
  id: number;
  location: string;
  stations: string;
  is_active: number;
  creator: string;
  sys_date_time: string;
  updated_at: string | null;
}

interface SettingItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

interface UserType {
  id: number;
  userName: string;
  userImage: string;
  role: string;
  userId: string;
  defaultStation: string;
  stations: string;
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

const availableStations = ["Final Line", "Internal Line", "External Line", "Valve Plate"];

export default function Locations() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const { register, handleSubmit, setValue, watch, reset } = useForm<LocationFormData>({
    defaultValues: {
      location: "",
      stations: [],
      selectAllStations: false,
      creator: "",
    },
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [user, setUser] = useState<UserType | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const itemsPerPage = 10;

  const selectAllStations = watch("selectAllStations");
  const selectedStations = watch("stations", []);

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
    if (selectAllStations) {
      setValue("stations", availableStations);
    } else if (selectedStations.length === availableStations.length) {
      setValue("stations", []);
    }
  }, [selectAllStations, setValue]);

  useEffect(() => {
    if (isEditModalOpen && selectedLocation) {
      setValue("location", selectedLocation.location);
      const stationsArray = selectedLocation.stations
        ? selectedLocation.stations.split(", ").filter((s: string) => s.trim() !== "")
        : [];
      setValue("stations", stationsArray);
      setValue("selectAllStations", stationsArray.length === availableStations.length);
    } else {
      reset({
        location: "",
        stations: [],
        selectAllStations: false,
        creator: "",
      });
    }
  }, [isEditModalOpen, selectedLocation, setValue, reset]);

  const fetchLocations = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/locations", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch Locations");
      }
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error("Error fetching Locations:", error);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const filteredLocations = locations.filter(
    (location) =>
      location.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.stations?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedLocations = filteredLocations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);

  const openAddLocationModal = () => {
    setSelectedLocation(null);
    reset();
    setIsModalOpen(true);
  };

  const openEditLocationModal = (location: Location) => {
    setSelectedLocation(location);
    setIsEditModalOpen(true);
  };

  const onSubmit: SubmitHandler<LocationFormData> = async (data) => {
    try {
      const payload = {
        location: data.location,
        stations: data.stations.join(", "),
        creator: user?.userId || "66708",
      };

      const url = selectedLocation
        ? `http://localhost:5000/api/locations/${selectedLocation.id}`
        : "http://localhost:5000/api/locations";
      const method = selectedLocation ? "PUT" : "POST";

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
          title: selectedLocation ? "Location Update Failed!" : "Location Insert Failed!",
          text: `Error: ${errorText || response.statusText}`,
          showConfirmButton: true,
        });
        return;
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: selectedLocation ? "Location Updated Successfully!" : "Location Inserted Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedLocation(null);
        fetchLocations();
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
    if (!selectedLocation) return;

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
        const response = await fetch(`http://localhost:5000/api/locations/${selectedLocation.id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to delete location: ${errorText || response.statusText}`);
        }

        Swal.fire({
          title: "Deleted!",
          text: "Location has been deleted.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        setIsEditModalOpen(false);
        setSelectedLocation(null);
        fetchLocations();
      } catch (error) {
        console.error("Error deleting location:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to delete location.",
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
          <h1 className="text-3xl font-bold">Locations</h1>
          <button
            onClick={openAddLocationModal}
            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition"
          >
            <Plus className="w-5 h-5 mr-2 font-bold" /> <span className="font-bold">Location</span>
          </button>
        </div>
        <div className="mb-4 max-w-[90rem] mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by location or stations..."
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
                  <th className="p-3 text-center">Location</th>
                  <th className="p-3 text-center">Stations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {paginatedLocations.map((location, index) => (
                  <tr
                    key={location.id}
                    className={`cursor-pointer hover:bg-green-100 transition duration-200 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                    onClick={() => openEditLocationModal(location)}
                  >
                    <td className="p-3 text-center">{location.location}</td>
                    <td className="p-3 font-semibold text-center">{location.stations || "-"}</td>
                    
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
                <h2 className="text-2xl font-semibold">{isModalOpen ? "Add New Location" : "Edit Location"}</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedLocation(null);
                    reset();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <input
                  {...register("location")}
                  placeholder="Location"
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
                      setSelectedLocation(null);
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