import ReactECharts from "echarts-for-react";

const COLORS = {
  SQLi: "#ff4d4f",
  XSS: "#faad14",
  Rate: "#1890ff",
  LFI: "#722ed1",
  CMD: "#eb2f96",
  DIR: "#13c2c2",
  Other: "#63615f"
};

export default function AttackChart({ stats }) {
  const data = [
    { name: "SQLi", value: stats.sql || 0 },
    { name: "XSS", value: stats.xss || 0 },
    { name: "Rate", value: stats.rate || 0 },
    { name: "LFI", value: stats.lfi || 0 },
    { name: "CMD", value: stats.cmd || 0 },
    { name: "DIR", value: stats.dir || 0 },
    { name: "Other", value: stats.Other || 0 }
  ];

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },

    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },

    xAxis: {
      type: "category",
      data: data.map(d => d.name),
      axisLine: {
        lineStyle: { color: "#999" }
      }
    },

    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: { type: "dashed" }
      }
    },

    series: [
      {
        name: "Attacks",
        type: "bar",
        data: data.map(d => ({
          value: d.value,
          itemStyle: {
            color: COLORS[d.name]
          }
        })),
        barWidth: "50%",
        showBackground: true,
        backgroundStyle: {
          color: "rgba(180, 180, 180, 0.1)"
        },

        label: {
          show: true,
          position: "top",
          fontWeight: "bold"
        }
      }
    ],

    animationDuration: 1200,
    animationEasing: "elasticOut"
  };

  return (
    <div className="chart-wrapper">
      <h2>Attack Distribution</h2>

      <ReactECharts
        option={option}
        style={{ height: 350, width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}