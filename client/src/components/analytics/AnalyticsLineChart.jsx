import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const AnalyticsLineChart = ({
  data,
  xKey,
  yKey,
  color = "#2563eb",
  height = 260,
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data}>
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
      <Line
        type="monotone"
        dataKey={yKey}
        stroke={color}
        strokeWidth={2}
        dot={{ r: 3 }}
      />
    </LineChart>
  </ResponsiveContainer>
);

export default AnalyticsLineChart;
