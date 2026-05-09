import ReactECharts from "echarts-for-react";

export default function GeoPieChart({ logs }) {
  // Count attacks by country
  const countryMap = {};

  logs.forEach((log) => {
    const country = log.geo?.country || "Unknown";
    countryMap[country] = (countryMap[country] || 0) + 1;
  });

  const data = Object.entries(countryMap).map(([name, value]) => ({
    name,
    value
  }));

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)"
    },

    legend: {
      bottom: 0,
      textStyle: {
        color: "#cbd5f5"
      }
    },

    series: [
      {
        name: "Geo Distribution",
        type: "pie",
        radius: ["40%", "70%"], // donut style 🔥
        center: ["50%", "45%"],

        data,

        label: {
          color: "#fff"
        },

        itemStyle: {
          borderRadius: 6,
          borderColor: "#0f172a",
          borderWidth: 2
        },

        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0
          }
        }
      }
    ]
  };

  return (
    <div className="card">
      <h2>Geo Distribution</h2>
      <ReactECharts option={option} style={{ height: 350 }} />
    </div>
  );
}