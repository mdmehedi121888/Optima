import type React from "react";
import { useEffect, useState } from "react";
import { Clock, Users, RefreshCw, Zap, Trash, Mail, X } from "lucide-react";
import { Shift } from "./page";
import Swal from "sweetalert2";


interface Operator {
  id: number;
  userId: string;
  userName: string;
  userImage: string;
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
  is_active: number;
  creator: string | null;
  sys_date_time: string;
  updated_at: string | null;
}

interface StatusCounts {
  operators: number;
  productChangeover: number;
  downtime: number;
  speedLoss: number;
  scrap: number;
  mail: number;
}

interface ChangeoverFormData {
  productId: string;
  startTime: string;
  endTime: string;
}

export function StatusBar({ stations, shift }: { stations: string; shift: Shift | null }) {
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    operators: 0,
    productChangeover: 0,
    downtime: 0,
    speedLoss: 0,
    scrap: 0,
    mail: 0,
  });

  const [operators, setOperators] = useState<Operator[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [showChangeoverModal, setShowChangeoverModal] = useState(false);

  // Fetch operators data
  useEffect(() => {
    const fetchOperatorData = async () => {
      try {
        if (!stations || !shift?.shiftName) return;

        const response = await fetch(
          `http://localhost:5000/api/operators/specific?stations=${stations}&shift=${shift.shiftName}`
        );
        const data = await response.json();

        setOperators(
          data.map((item: any) => ({
            id: item.id,
            userId: item.userId,
            userName: item.userName,
            userImage: item.userImage,
          }))
        );

        setStatusCounts({
          operators: data.length || 0,
          productChangeover: data.productChangeover || 0,
          downtime: data.downtime || 0,
          speedLoss: data.speedLoss || 0,
          scrap: data.scrap || 0,
          mail: data.mail || 0,
        });
      } catch (error) {
        console.error("Error fetching operators data:", error);
      }
    };

    fetchOperatorData();
  }, [stations, shift]);

  // Fetch products data for the changeover modal
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!stations) return;

        const response = await fetch(`http://localhost:5000/api/products/specific?stations=${stations}`);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data);
        console.log("Products:", data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, [stations]);

  // Handle form submission for product changeover
  const handleChangeoverSubmit = async (data: ChangeoverFormData) => {
    try {
      // Find the selected product
      const selectedProduct = products.find((product) => product.id === parseInt(data.productId));
      if (!selectedProduct) {
        alert("Selected product not found.");
        return;
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Construct the payload for the backend
      const payload = {
        productName: selectedProduct.productName,
        productCode: selectedProduct.productCode,
        productGroup: selectedProduct.productGroup,
        station: stations,
        productionDate: today, // Today's date
        cycleTime: selectedProduct.cycleTime,
        unitsPerSensorSignal: selectedProduct.unitsPerSensorSignal,
        startTime: data.startTime,
        endTime: data.endTime,
        qty: 280, // Default quantity as per requirement
      };

      // Send POST request to the backend
      const response = await fetch("http://localhost:5000/api/products/createProductRecords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save product changeover data");
      }

      Swal.fire({
              position: "center",
              icon: "success",
              title: "Product Saved Successfully!",
              showConfirmButton: false,
              timer: 2000,
            }).then(() => {
              setShowChangeoverModal(false);
            });
    } catch (error) { 
      console.error("Error saving product changeover data:", error);
      Swal.fire({
                position: "center",
                icon: "error",
                title:  "Failed to save product changeover data. Please try again!" ,
                showConfirmButton: false,
                timer: 2000,
              });
              return;
    }
  };

  return (
    <>
      <div className="h-16 border-t border-gray-800 px-4 flex items-center justify-between">
        <StatusItem
          icon={Users}
          label="Operators"
          count={statusCounts.operators}
          onClick={() => setShowOperatorModal(true)}
        />
        <StatusItem
          icon={RefreshCw}
          label="Product changeover"
          onClick={() => setShowChangeoverModal(true)}
        />
        <StatusItem icon={Clock} label="Downtime" count={statusCounts.downtime} />
        <StatusItem icon={Zap} label="Speed loss" count={statusCounts.speedLoss} />
        <StatusItem icon={Trash} label="Scrap" count={statusCounts.scrap} />
        <StatusItem icon={Mail} label="Mail" count={statusCounts.mail} />
      </div>

      {/* Operator Modal */}
      {showOperatorModal && (
        <Modal title="Operator Details" onClose={() => setShowOperatorModal(false)}>
          {operators.length > 0 ? (
            <ul className="space-y-4">
              {operators.map((operator) => (
                <li
                  key={operator.id}
                  className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700"
                >
                  <img
                    src={`https://hrms.waltonbd.com/${operator.userImage}`}
                    className="h-16 w-16 rounded-full object-content border-2 border-gray-600 shadow-lg"
                    alt={operator.userName}
                  />
                  <div className="text-gray-300">
                    <p className="text-sm">
                      <strong className="text-gray-100">ID:</strong> {operator.userId}
                    </p>
                    <p className="text-lg font-semibold text-gray-100">{operator.userName}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center">No operators found.</p>
          )}
        </Modal>
      )}

      {/* Product Changeover Modal */}
      {showChangeoverModal && (
        <ChangeoverModal
          products={products}
          onSubmit={handleChangeoverSubmit}
          onClose={() => setShowChangeoverModal(false)}
        />
      )}
    </>
  );
}

function StatusItem({
  icon: Icon,
  label,
  count,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer" onClick={onClick}>
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {count !== undefined && (
        <span className="bg-red-500 text-white text-xs px-1.5 rounded-full">{count}</span>
      )}
    </div>
  );
}

function ChangeoverModal({
  products,
  onSubmit,
  onClose,
}: {
  products: Product[];
  onSubmit: (data: ChangeoverFormData) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<ChangeoverFormData>({
    productId: "",
    startTime: "",
    endTime: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.startTime || !formData.endTime) {
      alert("Please fill in all fields.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
      <div
        className="bg-gray-900/90 shadow-2xl border border-gray-700 p-6 rounded-xl w-full max-w-md transform scale-95 transition-transform duration-300 hover:scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-3">
          <h2 className="text-lg font-bold text-gray-100 tracking-wide">Product Changeover</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition duration-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Product</label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleInputChange}
              className="w-full bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.productName}
                </option>
              ))}
            </select>
          </div>

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

          {/* Modal Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-2 px-5 rounded-lg transition duration-300 shadow-lg shadow-red-500/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-5 rounded-lg transition duration-300 shadow-lg shadow-green-500/30"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
      <div
        className="bg-gray-900/90 shadow-2xl border border-gray-700 p-6 rounded-xl w-full max-w-md transform scale-95 transition-transform duration-300 hover:scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-700 pb-3">
          <h2 className="text-lg font-bold text-gray-100 tracking-wide">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition duration-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="mt-4 text-gray-300 space-y-4">{children}</div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-2 px-5 rounded-lg transition duration-300 shadow-lg shadow-red-500/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}