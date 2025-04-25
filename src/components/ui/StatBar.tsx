import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  highlight?: boolean;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, max = 100, highlight = false }) => {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className={highlight ? 'text-yellow-300 font-bold' : 'text-slate-300'}>{label}</span>
        <span className={highlight ? 'text-yellow-200 font-bold' : 'text-slate-200'}>{value}</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={
            highlight
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 h-2 rounded-full transition-all duration-700'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-700'
          }
          style={{ width: percent + '%' }}
        />
      </div>
    </div>
  );
};

export default StatBar;
