import {
  User,
  Plus,
  X,
  EyeOff,
  Eye,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Swal from "sweetalert2";
import {  UserType } from "../../../context/AuthContext";

interface UserFormData {
    userId: string;
    password: string;
    role: string;
    stations: string[];
}

interface User {
    id: number;
    userName: string;
    userImage: string;
    role: string;
    userId: string;
    password: string;
    defaultStation: string;
    stations: string;
    creator: string;
}


export default function Users() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { register, watch, handleSubmit, setValue, reset } = useForm<UserFormData>();
  const [users, setUsers] = useState<User[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const itemsPerPage = 10;
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
    if (isEditModalOpen && selectedUser) {
      setValue("userId", selectedUser.userId);
      setValue("password", selectedUser.password);
      setValue("role", selectedUser.role);
      setValue("stations", selectedUser.stations?.split(", ") || []);
    } else {
      reset();
    }
  }, [isEditModalOpen, selectedUser, setValue, reset]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/users", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const openAddUserModal = () => {
    setSelectedUser(null);
    reset();
    setIsModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const onSubmit: SubmitHandler<UserFormData> = async (data) => {
    try {
      let picUrl = "";
      let empName = "";

      if (!selectedUser) {
        const externalResponse = await fetch(`https://whrmsapi.waltonbd.com/info/emp_info.php?emp_id=${data.userId}`);
        if (!externalResponse.ok) {
          throw new Error("Failed to fetch external API data");
        }
        const externalData = await externalResponse.json();

        picUrl = externalData?.PIC_URL_ || "";
        empName = externalData?.EMP_NAME || "";
      }

      const payload = {
        ...data,
        stations: data.stations?.join(", ") || "",
        userImage: picUrl,
        userName: empName,
        creator: creator
      };

      const url = selectedUser
        ? `http://localhost:5000/api/users/${selectedUser.id}`
        : "http://localhost:5000/api/users";
      const method = selectedUser ? "PUT" : "POST";

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
          title: selectedUser ? "User Update Failed!" : "User Insert Failed!",
          showConfirmButton: false,
          timer: 2000,
        });
        return;
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: selectedUser ? "User Updated Successfully!!" : "User Inserted Successfully!!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
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

    reset();
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

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
        const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete user");
        }

        Swal.fire({
          title: "Deleted!",
          text: "User has been deleted.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        setIsEditModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to delete user.",
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
          <h1 className="text-3xl font-bold">Users</h1>
          <button onClick={openAddUserModal} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition">
            <Plus className="w-5 h-5 mr-2 font-bold" /> <span className="font-bold">USER</span>
          </button>
        </div>
        <div className="mb-4 max-w-[90rem] mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by ID or name..."
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
                  <th className="p-3 text-center">ID</th>
                  <th className="p-3 text-center">Name</th>
                  <th className="p-3 text-center">Image</th>
                  <th className="p-3 text-center">Role</th>
                  <th className="p-3 text-center">Stations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {paginatedUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`cursor-pointer hover:bg-green-100 transition duration-200 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                    onClick={() => openEditUserModal(user)}
                  >
                    <td className="p-3 font-semibold text-center">{user.userId}</td>
                    <td className="p-3 font-semibold text-center">{user.userName}</td>
                    <td className="p-3 font-semibold text-center">
                      <img
                        src={`https://hrms.waltonbd.com/${user.userImage}`}
                        className="h-24 w-24 mx-auto rounded-full object-contain"
                        alt="User"
                      />
                    </td>
                    <td className="p-3 text-center">{user.role}</td>
                    <td className="p-3 text-center">{user.stations}</td>
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
                <h2 className="text-2xl font-semibold">{isModalOpen ? "Add New User" : "Edit User"}</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                    reset();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <input
                  {...register("userId")}
                  placeholder="User ID"
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="relative w-full">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <select
                  {...register("role")}
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Role</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Incharge">Incharge</option>

                </select>
                <div className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500">
                  <h1 className="text-left font-semibold text-lg p-2">Station</h1>
                  {["Final Line", "Internal Line", "External Line", "Valve Plate"].map((station, index) => (
                    <label key={index} className="flex items-center space-x-2 px-2 py-1">
                      <input
                        type="checkbox"
                        {...register("stations")}
                        value={station}
                        className="form-checkbox text-green-500 focus:ring-green-500"
                        defaultChecked={selectedUser?.stations?.includes(station)}
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
                      setSelectedUser(null);
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