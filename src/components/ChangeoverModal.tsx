// ChangeoverModal.tsx
import { FC, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "./Modal";

// Define Shift interface directly
interface Shift {
  shiftName: string;
  // Add other properties if needed, e.g.:
  // id?: number;
  // startTime?: string;
  // endTime?: string;
}

interface Product {
  id: number;
  productName: string;
  productCode: string;
  productGroup: string;
  stations: string;
  cycleTime: string;
  unitsPerSensorSignal: string;
}

interface ChangeoverFormData {
  productId: string;
  startTime: string;
  endTime: string;
}

interface ChangeoverModalProps {
  products: Product[];
  stations: string;
  shift: Shift | null;
  onClose: () => void;
}

export const ChangeoverModal: FC<ChangeoverModalProps> = ({ products, stations, shift, onClose }) => {
  const [formData, setFormData] = useState<ChangeoverFormData>({
    productId: "",
    startTime: "",
    endTime: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.startTime || !formData.endTime) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const selectedProduct = products.find((product) => product.id === parseInt(formData.productId));
      if (!selectedProduct) {
        alert("Selected product not found.");
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const payload = {
        productName: selectedProduct.productName,
        productCode: selectedProduct.productCode,
        productGroup: selectedProduct.productGroup,
        station: stations,
        shift: shift?.shiftName,
        productionDate: today,
        cycleTime: selectedProduct.cycleTime,
        unitsPerSensorSignal: selectedProduct.unitsPerSensorSignal,
        startTime: formData.startTime,
        endTime: formData.endTime,
        qty: 280,
      };

      const response = await fetch("http://localhost:5000/api/products/createProductRecords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save product changeover data");

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Product Saved Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => onClose());
    } catch (error) {
      console.error("Error saving product changeover data:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Failed to save product changeover data. Please try again!",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  return (
    <Modal title="Product Changeover" onClose={onClose}>
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
    </Modal>
  );
};