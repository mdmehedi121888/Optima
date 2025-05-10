// DowntimeRecordsModal.tsx
import { FC } from "react";
import { Modal } from "./Modal";
import { Plus } from "lucide-react";

interface DowntimeFormData {
  startTime: string;
  endTime: string;
  problem_name: string;
  location: string;
  planned_status: "planned" | "unplanned";
}

interface DowntimeRecordsModalProps {
  downtimeRecords: DowntimeFormData[];
  onAdd: () => void;
  onClose: () => void;
}

export const DowntimeRecordsModal: FC<DowntimeRecordsModalProps> = ({ downtimeRecords, onAdd, onClose }) => {
  return (
    <Modal title="Downtime Records" onClose={onClose}>
      <div className="mt-4 space-y-4">
        {downtimeRecords.length > 0 ? (
          <ul className="space-y-4">
            {downtimeRecords.map((record, index) => (
              <li
                key={index}
                className="p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700 text-gray-300"
              >
                
                <p><strong>Start Time:</strong> {record.startTime}</p>
                <p><strong>End Time:</strong> {record.endTime}</p>
                <p><strong>Problem Name:</strong> {record.problem_name}</p>
                <p><strong>Location:</strong> {record.location}</p>
                <p><strong>Status:</strong> {record.planned_status}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-center">No downtime records found.</p>
        )}
        <div className="flex justify-end">
          <button
            onClick={onAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 px-5 rounded-lg transition duration-300 shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>
      </div>
    </Modal>
  );
};