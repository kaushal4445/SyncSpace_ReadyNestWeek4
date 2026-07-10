import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const AnalyticsBarChart = ({
  data,
  xKey,
  yKey,
  color = "#2563eb",
  height = 260,
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data}>
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="#94a3b8"
        strokeOpacity={0.25}
      />
      <XAxis
        dataKey={xKey}
        tick={{ fontSize: 11, fill: "#64748b" }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ fontSize: 11, fill: "#64748b" }}
        axisLine={false}
        tickLine={false}
        allowDecimals={false}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: "#0f172a",
          borderColor: "#334155",
          color: "#f8fafc",
        }}
      />
      <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export default AnalyticsBarChart;
