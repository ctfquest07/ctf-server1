import { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './ScoreGraph.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// High-contrast distinct colors for top 10 teams (CTFd-inspired)
const TEAM_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52B788'  // Green
];

function ScoreGraph({ data, type }) {
  const [chartData, setChartData] = useState(null);
  const [hiddenDatasets, setHiddenDatasets] = useState(new Set());
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || (!data.teams && !data.users)) {
      return;
    }

    const items = type === 'teams' ? data.teams : data.users;
    
    if (!items || items.length === 0) {
      return;
    }

    // Get all unique timestamps and sort them
    const allTimestamps = new Set();
    items.forEach(item => {
      item.data.forEach(point => allTimestamps.add(point.time));
    });
    
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    // Format timestamps for display
    const labels = sortedTimestamps.map(ts => {
      const date = new Date(ts);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    });

    // Create datasets for each team/user
    const datasets = items.slice(0, 10).map((item, index) => {
      // Build cumulative scores at each timestamp
      const scores = sortedTimestamps.map(timestamp => {
        // Find the last score update before or at this timestamp
        let score = 0;
        for (const point of item.data) {
          if (point.time <= timestamp) {
            score = point.score;
          } else {
            break;
          }
        }
        return score;
      });

      return {
        label: item.name,
        data: scores,
        borderColor: TEAM_COLORS[index % TEAM_COLORS.length],
        backgroundColor: `${TEAM_COLORS[index % TEAM_COLORS.length]}15`,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: TEAM_COLORS[index % TEAM_COLORS.length],
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.1, // Slight curve for smoothness
        fill: false,
        hidden: hiddenDatasets.has(index)
      };
    });

    setChartData({
      labels,
      datasets
    });
  }, [data, type, hiddenDatasets]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#e0e0e0',
          padding: 15,
          font: {
            size: 12,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'line',
          boxWidth: 30,
          boxHeight: 3
        },
        onClick: (e, legendItem, legend) => {
          const index = legendItem.datasetIndex;
          const chart = legend.chart;
          
          // Toggle dataset visibility
          setHiddenDatasets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
              newSet.delete(index);
            } else {
              newSet.add(index);
            }
            return newSet;
          });
        }
      },
      title: {
        display: true,
        text: `Top ${type === 'teams' ? 'Teams' : 'Users'} Score Progression`,
        color: '#ffffff',
        font: {
          size: 18,
          weight: '600'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#ffffff',
        bodyColor: '#e0e0e0',
        borderColor: '#3a3a3a',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: (context) => {
            return `Time: ${context[0].label}`;
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} points`;
          }
        },
        titleFont: {
          size: 13,
          weight: '600'
        },
        bodyFont: {
          size: 12
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
          color: '#b0b0b0',
          font: {
            size: 13,
            weight: '500'
          }
        },
        ticks: {
          color: '#888888',
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12,
          font: {
            size: 11
          }
        },
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Score',
          color: '#b0b0b0',
          font: {
            size: 13,
            weight: '500'
          }
        },
        ticks: {
          color: '#888888',
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          },
          font: {
            size: 11
          }
        },
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.08)',
          drawBorder: false
        },
        beginAtZero: true
      }
    }
  };

  if (!chartData) {
    return (
      <div className="score-graph-container">
        <div className="score-graph-loading">Loading score progression...</div>
      </div>
    );
  }

  return (
    <div className="score-graph-container">
      <div className="score-graph-wrapper">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}

export default ScoreGraph;
