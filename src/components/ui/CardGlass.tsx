import React from 'react';
import cn from 'classnames';

interface CardGlassProps {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const CardGlass: React.FC<CardGlassProps> = ({ className = '', children, style }) => (
  <div
    className={cn(
      'backdrop-blur-lg bg-gradient-to-br from-blue-900/70 to-indigo-900/60 border border-blue-400/20 rounded-2xl shadow-xl p-4 transition-all duration-300',
      'hover:shadow-2xl hover:border-blue-400/40',
      className
    )}
    style={{
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      ...style,
    }}
  >
    {children}
  </div>
);

export default CardGlass;
