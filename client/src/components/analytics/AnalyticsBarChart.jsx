import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const AnalyticsBarChart = ({ data, xKey, yKey, color = "#2563eb", height = 260 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
      <Tooltip />
      <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export default AnalyticsBarChart;
