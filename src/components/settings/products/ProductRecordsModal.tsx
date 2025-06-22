import { FC, useEffect, useState } from "react";
   import { Modal } from "../../common/Modal";
   import { Plus, Edit, Trash } from "lucide-react";
   import Swal from "sweetalert2";
import {  UserType } from "../../../context/AuthContext";

   interface Shift {
     shiftName: string;
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

   interface ProductRecord {
     id?: number;
     productId: string;
     productName: string;
     startTime: string;
     endTime: string;
     stations: string;
     shift: string;
   }


   interface ProductRecordsModalProps {
     products: Product[];
     stations: string;
     shift: Shift | null;
     productRecords: ProductRecord[];
     onClose: () => void;
     onSubmitSuccess: () => void;
     onAdd: () => void;
   }

   export const ProductRecordsModal: FC<ProductRecordsModalProps> = ({
     products,
     stations,
     shift,
     productRecords,
     onClose,
     onSubmitSuccess,
     onAdd,
   }) => {

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

  const creator =user?.userId;
     const [editingRecord, setEditingRecord] = useState<ProductRecord | null>(null);
     const [formData, setFormData] = useState<ProductRecord>({
       productId: "",
       productName: "",
       startTime: "",
       endTime: "",
       stations: stations,
       shift: shift?.shiftName || "",
     });

    

     useEffect(() => {
       if (editingRecord) {
         setFormData({
           id: editingRecord.id,
           productId: editingRecord.productId,
           productName:editingRecord.productName,
           startTime: editingRecord.startTime,
           endTime: editingRecord.endTime,
           stations: editingRecord.stations,
           shift: editingRecord.shift,
         });
       } else {
         setFormData({
           productId: "",
           productName:"",
           startTime: "",
           endTime: "",
           stations: stations,
           shift: shift?.shiftName || "",
         });
       }
     }, [editingRecord, stations, shift]);

     const handleEditClick = (record: ProductRecord) => {
      // console.log("record: ",record)
       setEditingRecord(record);
     };

     const handleDeleteClick = async (record: ProductRecord) => {
       try {
         const response = await fetch(
           `http://localhost:5000/api/products/record/${record.id}`,
           {
             method: "DELETE",
           }
         );

         if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || "Failed to delete product record");
         }

         Swal.fire({
           position: "center",
           icon: "success",
           title: "Product Record Deleted Successfully!",
           showConfirmButton: false,
           timer: 2000,
         }).then(() => {
           setEditingRecord(null);
           onSubmitSuccess();
         });
       } catch (error) {
         console.error("Error deleting product record:", error);
         Swal.fire({
           position: "center",
           icon: "error",
           title: "Failed to delete product record. Please try again!",
           showConfirmButton: false,
           timer: 2000,
         });
       }
     };

     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
       const { name, value } = e.target;
       setFormData((prev) => ({ ...prev, [name]: value }));
     };

     const handleUpdateSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       if (!formData.id || !formData.productId || !formData.startTime || !formData.endTime) {
         Swal.fire({
           position: "center",
           icon: "warning",
           title: "Please fill in all fields, including a valid record ID and product.",
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
         const response = await fetch(
           `http://localhost:5000/api/products/record/${formData.id}`,
           {
             method: "PUT",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify(payload),
           }
         );

         if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || "Failed to update product record");
         }

         Swal.fire({
           position: "center",
           icon: "success",
           title: "Product Record Updated Successfully!",
           showConfirmButton: false,
           timer: 2000,
         }).then(() => {
           setEditingRecord(null);
           onSubmitSuccess();
         });
       } catch (error) {
         console.error("Error updating product record:", error);
         Swal.fire({
           position: "center",
           icon: "error",
           title: "Failed to update product record. Please try again!",
           showConfirmButton: false,
           timer: 2000,
         });
       }
     };

     const handleCancelEdit = () => {
       setEditingRecord(null);
     };

     return (
       <Modal title="Product Records" onClose={onClose}>
         <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-4">
           {editingRecord ? (
             <form onSubmit={handleUpdateSubmit} className="space-y-4">
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
                   onClick={handleCancelEdit}
                   className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-2 px-5 rounded-lg transition duration-300 shadow-lg shadow-red-500/30"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-5 rounded-lg transition duration-300 shadow-lg shadow-green-500/30"
                 >
                   Update
                 </button>
               </div>
             </form>
           ) : (
             <>
               {productRecords.length > 0 ? (
                 <ul className="space-y-4">
                   {productRecords.map((record, index) => {
                     const product = products.find((p) => p.productName === (record.productName));
                     return (
                       <li
                         key={index}
                         className="p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700 text-gray-300"
                       >
                         <div className="flex justify-between items-center">
                           <div>
                             <p><strong>Product:</strong> {product ? `${product.productName}` : "Unknown"}</p>
                             <p><strong>Start Time:</strong> {record.startTime}</p>
                             <p><strong>End Time:</strong> {record.endTime}</p>
                             <p><strong>Station:</strong> {record.stations}</p>
                             <p><strong>Shift:</strong> {record.shift}</p>
                           </div>
                           <div className="flex gap-3">
                             <button
                               onClick={() => handleEditClick(record)}
                               className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-1 px-3 rounded-lg transition duration-300 shadow-lg shadow-green-500/30"
                             >
                               <Edit className="w-5 h-5" />
                             </button>
                             <button
                               onClick={() => handleDeleteClick(record)}
                               className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-1 px-3 rounded-lg transition duration-300 shadow-lg shadow-red-500/30"
                             >
                               <Trash className="w-5 h-5" />
                             </button>
                           </div>
                         </div>
                       </li>
                     );
                   })}
                 </ul>
               ) : (
                 <p className="text-gray-400 text-center">No product records found.</p>
               )}
               <div className="flex justify-end mt-4 mr-3">
                 <button
                   onClick={onAdd}
                   className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 px-5 rounded-lg transition duration-300 shadow-lg shadow-blue-500/30"
                 >
                   <Plus className="w-5 h-5" />
                   Add
                 </button>
               </div>
             </>
           )}
         </div>
       </Modal>
     );
   };