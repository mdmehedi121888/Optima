import { FC, useContext, useEffect, useState } from "react";
import { Modal } from "../../common/Modal";
import Swal from "sweetalert2";
import { AuthContext } from "../../../context/AuthContext";

interface Shift {
  shiftName: string;
}

interface Product {
  id: number;
  productName: string;
  productCode: string;
  productGroup: string;
  cycleTime: string;
  unitsPerSensorSignal: string;
}

interface ProductRecord {
  productId: string;
  startTime: string;
  endTime: string;
  stations: string;
  shift: string;
}


interface ProductModalProps {
  stations: string;
  shift: Shift | null;
  products: Product[];
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export const ProductModal: FC<ProductModalProps> = ({
  stations,
  shift,
  products,
  onClose,
  onSubmitSuccess,
}) => {
  const auth = useContext(AuthContext);

  const creator = auth?.user?.userId;
  const [formData, setFormData] = useState<ProductRecord>({
    productId: "",
    startTime: "",
    endTime: "",
    stations: stations,
    shift: shift?.shiftName || "",
  });


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.startTime || !formData.endTime || !creator) {
      Swal.fire({
        position: "center",
        icon: "warning",
        title: "Please fill in all fields and ensure you are logged in.",
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    const selectedProduct = products.find((p) => p.id === parseInt(formData.productId));
    if (!selectedProduct) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Invalid product selected.",
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    const payload = {
      productName: selectedProduct.productName,
      productCode: selectedProduct.productCode,
      productGroup: selectedProduct.productGroup,
      station: stations,
      shift: shift?.shiftName || "",
      productionDate: new Date().toISOString().slice(0, 10),
      cycleTime: selectedProduct.cycleTime,
      unitsPerSensorSignal: selectedProduct.unitsPerSensorSignal,
      startTime: formData.startTime,
      endTime: formData.endTime,
      qty: parseInt(selectedProduct.cycleTime),
      creator:creator,
    };

    try {
      const response = await fetch("http://localhost:5000/api/products/createProductRecords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create product record");
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Product Record Created Successfully!",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        onSubmitSuccess();
        onClose();
      });
    } catch (error) {
      console.error("Error creating product record:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Failed to create product record. Please try again!",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  return (
    <Modal title="Create Product Record" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
                {product.productName} ({product.productCode})
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
        <div className="flex justify-end gap-3">
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