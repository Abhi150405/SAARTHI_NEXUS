import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Filter, DollarSign, TrendingUp, Users } from 'lucide-react';
import '../styles/Dashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = () => {
    // Mock Data
    const lineData = {
        labels: ['2020', '2021', '2022', '2023', '2024'],
        datasets: [
            {
                label: 'Placement Percentage',
                data: [75, 82, 88, 85, 92],
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.5)',
                tension: 0.4,
            },
            {
                label: 'Avg Package (LPA)',
                data: [4.5, 5.2, 6.0, 7.5, 8.2],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.4,
                yAxisID: 'y1',
            }
        ],
    };

    const lineOptions = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: { position: 'top' },
            title: { display: false },
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Percentage %' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                title: { display: true, text: 'CTC (LPA)' }
            },
        },
    };

    const barData = {
        labels: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Capgemini', 'PhonePe', 'Amazon'],
        datasets: [
            {
                label: 'Students Hired',
                data: [120, 95, 80, 110, 60, 15, 8],
                backgroundColor: '#4F46E5',
            },
        ],
    };

    const pieData = {
        labels: ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE'],
        datasets: [
            {
                data: [45, 25, 15, 5, 10],
                backgroundColor: [
                    '#4F46E5',
                    '#3B82F6',
                    '#818CF8',
                    '#60A5FA',
                    '#C7D2FE',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Placement Analytics</h2>
                    <p className="page-subtitle">Overview of placement statistics and trends</p>
                </div>
                <div className="filter-controls">
                    <button className="btn btn-outline btn-sm">
                        <Filter size={16} />
                        Filter: 2024
                    </button>
                </div>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">
                        <DollarSign size={24} />
                    </div>
                    <div className="metric-content">
                        <p className="metric-label">Average CTC</p>
                        <h3 className="metric-value">₹ 8.5 LPA</h3>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="metric-content">
                        <p className="metric-label">Highest CTC</p>
                        <h3 className="metric-value">₹ 42 LPA</h3>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">
                        <Users size={24} />
                    </div>
                    <div className="metric-content">
                        <p className="metric-label">Total Placed</p>
                        <h3 className="metric-value">856</h3>
                    </div>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-card full-width">
                    <h3>Year-wise Placement Trends</h3>
                    <div className="chart-wrapper">
                        <Line options={lineOptions} data={lineData} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Company-wise Hiring</h3>
                    <div className="chart-wrapper">
                        <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Dept. Distribution</h3>
                    <div className="chart-wrapper pie-chart">
                        <Pie data={pieData} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
