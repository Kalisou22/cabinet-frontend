import React from 'react';

const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = 'neutral',
  onClick
}) => {
  const colorClasses = {
    success: 'text-success bg-success-light/30',
    danger: 'text-danger bg-danger-light/30',
    warning: 'text-warning-dark bg-warning-light/30',
    info: 'text-info-dark bg-info-light/30',
    neutral: 'text-text-secondary bg-gray-100',
  };

  const valueColor = {
    success: 'amount-positive',
    danger: 'amount-negative',
    warning: 'text-warning-dark',
    info: 'text-info-dark',
    neutral: 'amount-neutral',
  };

  return (
    <div
      className={`card-stat ${onClick ? 'cursor-pointer hover:shadow-hover hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="stat-label">{title}</p>
          <p className={`stat-value ${valueColor[color]}`}>
            {value}
          </p>
          {trend && (
            <div className={`stat-trend ${trend > 0 ? 'stat-trend-up' : 'stat-trend-down'}`}>
              <span>{trend > 0 ? '📈' : '📉'}</span>
              <span>{Math.abs(trendValue)}% vs mois dernier</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;