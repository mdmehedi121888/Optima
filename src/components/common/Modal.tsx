// Modal.tsx
import { FC } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const Modal: FC<ModalProps> = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
      <div
        className="bg-gray-900/90 shadow-2xl border border-gray-700 p-6 rounded-xl w-full max-w-3xl transform scale-95 transition-transform duration-300 hover:scale-100"
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
};