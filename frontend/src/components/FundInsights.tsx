import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { HistoricalPoint } from '../types';
import { formatTry } from '../utils/format';

interface Props {
  marketCap: HistoricalPoint[];
  investors: HistoricalPoint[];
}

const numberFormatter = new Intl.NumberFormat('tr-TR');

const FundInsights = ({ marketCap, investors }: Props) => {
  const merged = marketCap.map((point, index) => ({
    date: point.date,
    marketCap: point.value,
    investors: investors[index]?.value ?? investors[investors.length - 1]?.value ?? 0,
  }));

  return (
    <div className="card">
      <div className="section-title" style={{ marginBottom: 8 }}>
        Fund size & participation
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" minTickGap={32} tickMargin={8} tick={{ fill: '#475569', fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => `${(value / 1_000_000).toFixed(0)}M`}
              tick={{ fill: '#475569', fontSize: 12 }}
              width={62}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => numberFormatter.format(value)}
              tick={{ fill: '#475569', fontSize: 12 }}
              width={62}
            />
            <Tooltip
              formatter={(value: number, name) =>
                name === 'marketCap'
                  ? formatTry(value)
                  : `${numberFormatter.format(Math.round(value))} investors`
              }
              labelFormatter={(value) => `Date: ${value}`}
              contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
            />
            <Legend />
            <Line type="monotone" dataKey="marketCap" stroke="#16a34a" strokeWidth={2} dot={false} yAxisId="left" />
            <Line type="monotone" dataKey="investors" stroke="#0ea5e9" strokeWidth={2} dot={false} yAxisId="right" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="metric-label" style={{ marginTop: 10 }}>
        Monitor how fund size and investor base evolve together.
      </div>
    </div>
  );
};

export default FundInsights;
