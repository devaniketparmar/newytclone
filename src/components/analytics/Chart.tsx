import React from 'react';

interface ChartData {
  date: string;
  value: number;
  [key: string]: any;
}

interface ChartProps {
  data: ChartData[];
  title: string;
  type?: 'line' | 'bar' | 'area';
  height?: number;
  color?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
}

export default function Chart({
  data,
  title,
  type = 'line',
  height = 300,
  color = '#ef4444',
  showGrid = true,
  showLegend = false,
  formatValue = (value) => value.toString()
}: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No data available</p>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPathData = () => {
    if (data.length === 0) return '';
    
    const width = 100;
    const height = 100;
    const stepX = width / (data.length - 1);
    
    let path = '';
    data.forEach((point, index) => {
      const x = index * stepX;
      const y = height - ((point.value - minValue) / range) * height;
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  const getBarData = () => {
    if (data.length === 0) return [];
    
    const width = 100;
    const barWidth = width / data.length;
    
    return data.map((point, index) => {
      const x = index * barWidth;
      const barHeight = ((point.value - minValue) / range) * 100;
      
      return {
        x,
        width: barWidth * 0.8,
        height: barHeight,
        y: 100 - barHeight
      };
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {showLegend && (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span>Current Period</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Grid lines */}
          {showGrid && (
            <g className="text-gray-200">
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              ))}
              {[0, 20, 40, 60, 80, 100].map((x) => (
                <line
                  key={x}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              ))}
            </g>
          )}

          {/* Chart content */}
          {type === 'line' && (
            <>
              <path
                d={getPathData()}
                fill="none"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = 100 - ((point.value - minValue) / range) * 100;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="1"
                    fill={color}
                  />
                );
              })}
            </>
          )}

          {type === 'bar' && (
            <>
              {getBarData().map((bar, index) => (
                <rect
                  key={index}
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height}
                  fill={color}
                  opacity="0.8"
                />
              ))}
            </>
          )}

          {type === 'area' && (
            <>
              <path
                d={`${getPathData()} L 100 100 L 0 100 Z`}
                fill={color}
                opacity="0.2"
              />
              <path
                d={getPathData()}
                fill="none"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
          <span>{formatValue(maxValue)}</span>
          <span>{formatValue(Math.round((maxValue + minValue) / 2))}</span>
          <span>{formatValue(minValue)}</span>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
          {data.map((point, index) => (
            <span key={index} className="transform -rotate-45 origin-left">
              {formatDate(point.date)}
            </span>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-gray-500">Total</div>
          <div className="font-semibold text-gray-900">
            {formatValue(data.reduce((sum, d) => sum + d.value, 0))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Average</div>
          <div className="font-semibold text-gray-900">
            {formatValue(Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Peak</div>
          <div className="font-semibold text-gray-900">
            {formatValue(maxValue)}
          </div>
        </div>
      </div>
    </div>
  );
}
