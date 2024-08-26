// src/components/TimelineChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

const TimelineChart = ({ dataPoints }) => {
  // Sort data points by timestamp
  const sortedDataPoints = dataPoints.sort((a, b) => a.timestamp - b.timestamp);

  // Group data points by event type
  const bandwidthData = sortedDataPoints.filter(dp => dp.event === 'bandwidth');
  const latencyData = sortedDataPoints.filter(dp => dp.event === 'latency');
  const radioTechData = sortedDataPoints.filter(dp => dp.event === 'radio_tech');

  // Log data for debugging
  console.log("Bandwidth Data:", bandwidthData);
  console.log("Latency Data:", latencyData);
  console.log("Radio Tech Data:", radioTechData);

  const data = {
    datasets: [
      {
        label: 'Bandwidth (Mbits/sec)',
        data: bandwidthData.map(dp => ({
          x: new Date(dp.timestamp / 1e6),
          y: parseFloat(dp.value)
        })),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.1,
        yAxisID: 'y-axis-bandwidth'
      },
      {
        label: 'Latency (ms)',
        data: latencyData.map(dp => ({
          x: new Date(dp.timestamp / 1e6),
          y: parseFloat(dp.value)
        })),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        tension: 0.1,
        yAxisID: 'y-axis-latency'
      },
      {
        label: 'Network Mode Switch Event',
        data: radioTechData.map(dp => ({
          x: new Date(dp.timestamp / 1e6),
          y: 0,  // Position all radio tech events on the same line
          label: dp.value  // Store the value for labeling
        })),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 1)',
        pointStyle: 'circle',
        pointRadius: 5,
        showLine: false,
        yAxisID: 'y-axis-radio-tech'
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Event Data Over Time',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            if (context.dataset.label === 'Network Mode Switch Event') {
              return `Radio Tech: ${context.raw.label}`;
            }
            return `${context.dataset.label}: ${context.raw.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        title: {
          display: true,
          text: 'Time',
        },
        time: {
          unit: 'minute',
          tooltipFormat: 'PPpp',
        },
      },
      'y-axis-bandwidth': {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Bandwidth (Mbits/sec)',
        },
      },
      'y-axis-latency': {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Latency (ms)',
        },
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
      },
      'y-axis-radio-tech': {
        type: 'linear',
        display: false,
        position: 'right',
        ticks: {
          display: false
        },
        grid: {
          drawOnChartArea: false, // do not draw grid lines for this axis
        }
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default TimelineChart;
