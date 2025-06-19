// StatusItem.tsx
import { FC } from "react";

interface StatusItemProps {
  icon: React.ElementType;
  label: string;
  count?: number;
  onClick?: () => void;
}

export const StatusItem: FC<StatusItemProps> = ({ icon: Icon, label, count, onClick }) => {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer" onClick={onClick}>
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {count !== undefined && (
        <span className="bg-red-500 text-white text-xs px-1.5 rounded-full">{count}</span>
      )}
    </div>
  );
};