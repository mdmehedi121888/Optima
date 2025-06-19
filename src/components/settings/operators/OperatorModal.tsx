// OperatorModal.tsx
import { FC } from "react";
import { Modal } from "../../common/Modal";

interface Operator {
  id: number;
  userId: string;
  userName: string;
  userImage: string;
}

interface OperatorModalProps {
  operators: Operator[];
  onClose: () => void;
}

export const OperatorModal: FC<OperatorModalProps> = ({ operators, onClose }) => {
  return (
    <Modal title="Operator Details" onClose={onClose}>
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
  );
};