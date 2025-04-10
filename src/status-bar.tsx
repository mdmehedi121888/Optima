import type React from "react";
import { Clock, Users, RefreshCw, Zap, Trash, Mail } from "lucide-react";

export function StatusBar() {
  return (
    <div className="h-16 border-t border-gray-800 px-4 flex items-center justify-between">
      <StatusItem icon={Users} label="Operators" count={10} />
      <StatusItem icon={RefreshCw} label="Product changeover" count={5} />
      <StatusItem icon={Clock} label="Downtime" count={3} />
      <StatusItem icon={Zap} label="Speed loss" count={1} />
      <StatusItem icon={Trash} label="Scrap" count={4} />
      <StatusItem icon={Mail} label="" count={20} />
    </div>
  );
}

function StatusItem({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ElementType;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm">
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {count && (
        <span className="bg-red-500 text-white text-xs px-1.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}
