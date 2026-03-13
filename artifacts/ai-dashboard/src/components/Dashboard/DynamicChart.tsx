import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import type { ChartConfig } from '@workspace/api-client-react';

const CHART_COLORS = [
  'hsl(199 89% 48%)', // Cyan
  'hsl(262 83% 58%)', // Purple
  'hsl(316 73% 52%)', // Pink
  'hsl(43 96% 58%)',  // Yellow
  'hsl(142 71% 45%)', // Green
];

interface DynamicChartProps {
  config: ChartConfig;
}

export function DynamicChart({ config }: DynamicChartProps) {
  const { type, title, data, dataKeys, xKey } = config;

  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">No data available to visualize.</div>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl text-sm">
          <p className="font-semibold text-white mb-2">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-mono font-medium text-white">{formatNumber(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const commonProps = {
    data,
    margin: { top: 20, right: 20, left: 10, bottom: 20 }
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
              <XAxis dataKey={xKey || 'name'} stroke="currentColor" className="opacity-50 text-xs" tickMargin={10} />
              <YAxis stroke="currentColor" className="opacity-50 text-xs" tickFormatter={formatNumber} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {dataKeys.map((key, i) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                  strokeWidth={3}
                  dot={{ r: 4, fill: CHART_COLORS[i % CHART_COLORS.length], strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
              <XAxis dataKey={xKey || 'name'} stroke="currentColor" className="opacity-50 text-xs" tickMargin={10} />
              <YAxis stroke="currentColor" className="opacity-50 text-xs" tickFormatter={formatNumber} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {dataKeys.map((key, i) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  fill={CHART_COLORS[i % CHART_COLORS.length]} 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'horizontalBar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" horizontal={false} />
              <XAxis type="number" stroke="currentColor" className="opacity-50 text-xs" tickFormatter={formatNumber} />
              <YAxis dataKey={xKey || 'name'} type="category" stroke="currentColor" className="opacity-50 text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {dataKeys.map((key, i) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  fill={CHART_COLORS[i % CHART_COLORS.length]} 
                  radius={[0, 4, 4, 0]}
                  animationDuration={1500}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieDataKey = dataKeys[0] || 'value';
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} />
              <Pie
                data={data}
                dataKey={pieDataKey}
                nameKey={xKey || 'name'}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Visualization type "{type}" not supported.
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h4 className="text-lg font-display font-medium text-white mb-4 px-2">{title}</h4>
      <div className="flex-1 min-h-[300px]">
        {renderChart()}
      </div>
    </div>
  );
}
