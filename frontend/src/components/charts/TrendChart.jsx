import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Reusable line chart for anything score-over-time: mood trend, PHQ-9/GAD-7
 * progress, etc. Used by the student assessment history and the admin
 * analytics dashboard, so the visual language stays consistent app-wide.
 */
const TrendChart = ({ data, dataKey, xKey = 'date', color = '#1F4B43', height = 220, yDomain }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-teal-600/60 py-10 text-center">Not enough data yet to show a trend.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F4B4310" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={yDomain} allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrendChart;