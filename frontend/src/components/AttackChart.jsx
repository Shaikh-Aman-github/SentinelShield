import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function AttackChart({ stats }) {
  const data = [
  { name: "SQLi", value: stats.sql || 0 },
  { name: "XSS", value: stats.xss || 0 },
  { name: "Rate", value: stats.rate || 0 },
  { name: "LFI", value: stats.lfi || 0 },
  { name: "CMD", value: stats.cmd || 0 },
  { name: "DIR", value: stats.dir || 0 }
];

  return (
    <BarChart width={400} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" />
    </BarChart>
  );
}