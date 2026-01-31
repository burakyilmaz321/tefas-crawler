import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { formatTry6 } from '../utils/format';

interface Props {
  data: any[];
  metricLabel: string;
  selectedCodes: string[];
  isNormalized?: boolean;
  showMA?: boolean;
}

const colors = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea'];
const maColors = {
  MA50: '#f97316', // Orange
  MA200: '#22c55e', // Green
};

const PerformanceChart = ({ data, metricLabel, selectedCodes, isNormalized, showMA }: Props) => {
  const formatYAxis = (value: number) => {
    if (isNormalized) return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    if (value < 1) return formatTry6(value);
    return formatTry6(value);
  };

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div className="section-title" style={{ marginBottom: 16 }}>
        {metricLabel} Performance {isNormalized ? '(Relative Change %)' : ''}
      </div>
      <div className="chart-wrapper" style={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, left: 12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="date"
              minTickGap={40}
              tickMargin={12}
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                let formattedValue: string;
                if (isNormalized) {
                  formattedValue = `${value.toFixed(2)}%`;
                } else {
                  // Use 6 decimals for prices, remove trailing zeros
                  formattedValue = formatTry6(value);
                }
                const label = name.includes('_MA') ? name.replace('_', ' ') : name;
                return [formattedValue, label];
              }}
              labelFormatter={(value) => `Date: ${value}`}
              contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            />
            <Legend />
            {selectedCodes.map((code, index) => (
              <Line
                key={code}
                type="monotone"
                dataKey={code}
                name={code}
                stroke={colors[index % colors.length]}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
            {showMA && selectedCodes.map((code, index) => (
              <>
                <Line
                  key={`${code}_MA50`}
                  type="monotone"
                  dataKey={`${code}_MA50`}
                  name={`${code} MA50`}
                  stroke={maColors.MA50}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                />
                <Line
                  key={`${code}_MA200`}
                  type="monotone"
                  dataKey={`${code}_MA200`}
                  name={`${code} MA200`}
                  stroke={maColors.MA200}
                  strokeWidth={1.5}
                  strokeDasharray="8 4"
                  dot={false}
                  connectNulls
                />
              </>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;
