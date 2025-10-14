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
import { useState, useEffect} from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Swal from "sweetalert2";
import {  UserType } from "../../../context/AuthContext";

interface ProductFormData {
  id?: number;
  productName: string;
  productCode: string;
  productGroup: string;
  cycleTime: string;
  unitsPerSensorSignal: string;
  stations: string[];
  unit: string;
}

interface Product {
  id: number;
  productName: string;
  productCode: string;
  productGroup: string;
  stations: string;
  unit: string;
  cycleTime: string;
  unitsPerSensorSignal: string;
}



export default function Products() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { register, watch, handleSubmit, setValue, reset } = useForm<ProductFormData>();
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const itemsPerPage = 10;

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

  const creator =user?.userId;

  useEffect(() => {
    if (isEditModalOpen && selectedProduct) {
      setValue("productName", selectedProduct.productName);
      setValue("productCode", selectedProduct.productCode);
      setValue("productGroup", selectedProduct.productGroup);
      setValue("stations", selectedProduct.stations?.split(", ") || []);
      setValue("unit", selectedProduct.unit);
      setValue("cycleTime", selectedProduct.cycleTime);
      setValue("unitsPerSensorSignal", selectedProduct.unitsPerSensorSignal);
    } else {
      reset();
    }
  }, [isEditModalOpen, selectedProduct, setValue, reset]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/products`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.stations?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const selectedStations = watch("stations", []);

  const openAddProductModal = () => {
    setSelectedProduct(null);
    reset();
    setIsModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    try {
      if (selectedProduct && !selectedProduct.id) {
        throw new Error("Selected product ID is missing");
      }

      const payload = {
        ...data,
        stations: data.stations?.join(", ") || "",
        creator: creator
      };

      const url = selectedProduct
        ? `${process.env.REACT_APP_BACKEND_URL}/api/products/${selectedProduct.id}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/products`;
      const method = selectedProduct ? "PUT" : "POST";

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
        console.error(`Failed to ${selectedProduct ? "update" : "insert"} product: ${response.status} - ${errorText}`);
        Swal.fire({
          position: "center",
          icon: "error",
          title: selectedProduct ? "Product Update Failed!" : "Product Insert Failed!",
          text: `Error: ${errorText || response.statusText}`,
          showConfirmButton: true,
        });
        return;
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: selectedProduct ? "Product Updated Successfully!!" : "Product Inserted Successfully!!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedProduct(null);
        fetchProducts();
        reset();
      });
    } catch (error: any) {
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
    if (!selectedProduct || !selectedProduct.id) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "No product selected!",
        text: "Please select a product to delete.",
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
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/products/${selectedProduct.id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to delete product: ${response.status} - ${errorText}`);
          throw new Error(`Failed to delete product: ${errorText || response.statusText}`);
        }

        Swal.fire({
          title: "Deleted!",
          text: "Product has been deleted.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        setIsEditModalOpen(false);
        setSelectedProduct(null);
        fetchProducts();
      } catch (error: any) {
        console.error("Error deleting product:", error);
        Swal.fire({
          title: "Error!",
          text: error.message || "Failed to delete product.",
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
          <h1 className="text-3xl font-bold">Products</h1>
          <button
            onClick={openAddProductModal}
            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition"
          >
            <Plus className="w-5 h-5 mr-2 font-bold" /> <span className="font-bold">Product</span>
          </button>
        </div>
        <div className="mb-4 max-w-[90rem] mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by product name, group, or stations..."
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
                  <th className="p-3 text-center">Product Name</th>
                  <th className="p-3 text-center">Product Code</th>
                  <th className="p-3 text-center">Group</th>
                  <th className="p-3 text-center">Stations</th>
                  <th className="p-3 text-center">Unit</th>
                  <th className="p-3 text-center">Cycle Time (H)</th>
                  <th className="p-3 text-center">Units Per Sensor Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {paginatedProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    className={`cursor-pointer hover:bg-green-100 transition duration-200 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                    onClick={() => openEditProductModal(product)}
                  >
                    <td className="p-3 font-semibold text-center">{product.productName}</td>
                    <td className="p-3 font-semibold text-center">{product.productCode}</td>
                    <td className="p-3 font-semibold text-center">{product.productGroup}</td>
                    <td className="p-3 text-center">{product.stations}</td>
                    <td className="p-3 text-center">{product.unit}</td>
                    <td className="p-3 text-center">{product.cycleTime}</td>
                    <td className="p-3 text-center">{product.unitsPerSensorSignal}</td>
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
            <div className="bg-white p-6 rounded-xl shadow-lg w-[500px] md:w-[600px] lg:w-[900px] max-h-[90vh] overflow-y-auto relative">
              <div className="flex justify-between items-center border-b pb-3 sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-semibold">{isModalOpen ? "Add New Product" : "Edit Product"}</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedProduct(null);
                    reset();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <input
                  {...register("productName")}
                  placeholder="Product Name"
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  {...register("productCode")}
                  placeholder="Product Code"
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  {...register("productGroup")}
                  placeholder="Product Group"
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500">
                  <h1 className="text-left font-semibold text-lg p-2">Station</h1>
                  {["Final Line", "Internal Line", "External Line", "Valve Plate"].map((station, index) => (
                    <label key={index} className="flex items-center space-x-2 px-2 py-1">
                      <input
                        type="checkbox"
                        {...register("stations")}
                        value={station}
                        className="form-checkbox text-green-500 focus:ring-green-500"
                        defaultChecked={selectedProduct?.stations?.includes(station)}
                      />
                      <span>{station}</span>
                    </label>
                  ))}
                </div>
                <select
                  {...register("unit")}
                  className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Unit</option>
                  <option value="cycle">cycle</option>
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="liter">liter</option>
                </select>
                <h1 className="text-center font-semibold text-lg">Product Speed</h1>
                <div className="bg-gray-100 flex flex-col items-center p-4 space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex">
                        <div className="bg-green-700 h-16 w-40"></div>
                      </div>
                      <div className="flex items-center bg-gray-200 px-4 py-2 rounded text-sm text-gray-700">
                        <span className="w-3 h-3 bg-green-500 rounded-full inline-block mr-2"></span>
                        ≤14 sec
                      </div>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex">
                        <div className="bg-yellow-400 h-16 w-40"></div>
                      </div>
                      <div className="flex items-center bg-gray-200 px-4 py-2 rounded text-sm text-gray-700">
                        <span className="w-3 h-3 bg-yellow-400 rounded-full inline-block mr-2"></span>
                        ≤180 sec +
                        <span className="w-3 h-3 bg-green-500 rounded-full inline-block mx-2"></span>
                        14 sec
                      </div>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex">
                        <div className="bg-red-600 h-16 w-40"></div>
                      </div>
                      <div className="flex items-center bg-gray-200 px-4 py-2 rounded text-sm text-gray-700">
                        <span className="w-3 h-3 bg-red-600 rounded-full inline-block mr-2"></span>
                        ≤180 sec +
                        <span className="w-3 h-3 bg-green-500 rounded-full inline-block mx-2"></span>
                        14 sec
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                  <div className="relative w-full">
                    <input
                      {...register("cycleTime")}
                      placeholder="Ideal cycle time"
                      className="w-full border border-green-500 px-4 py-2 pr-16 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      pcs/h
                    </span>
                  </div>
                  <input
                    {...register("unitsPerSensorSignal")}
                    placeholder="Number of units registered per one sensor signal"
                    className="w-full border border-green-500 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsEditModalOpen(false);
                      setSelectedProduct(null);
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