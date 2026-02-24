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
import { Filter, DollarSign, TrendingUp, Users, Target } from 'lucide-react';
import CONFIG from '../config';
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
    const [selectedYear, setSelectedYear] = React.useState('2023-24');

    // Data extracted from Placement Reports (PDFs)
    const [yearlyData, setYearlyData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/placement-stats`);
                if (!response.ok) {
                    throw new Error('Failed to fetch placement stats');
                }
                const data = await response.json();
                setYearlyData(data);

                // Set initial selected year to the latest one available if not already set
                // We use React.useState initial value, so this logic updates it after fetch if needed.
                // However, selectedYear is state, so we might want to update it if the fetched data doesn't contain the default "2023-24".
                // But let's assume keys are consistent for now.
                const years = Object.keys(data);
                if (years.length > 0 && !years.includes(selectedYear)) {
                    setSelectedYear(years[0]);
                }
            } catch (err) {
                console.error("Error fetching stats:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !yearlyData) {
        return (
            <div className="flex items-center justify-center h-screen text-red-500">
                Error loading data: {error || 'No data available'}
            </div>
        );
    }

    const currentData = yearlyData?.[selectedYear];

    if (!currentData) {
        return <div className="p-8 text-center text-gray-500">No data available for {selectedYear}</div>;
    }

    // Chart Data Config
    // Chart Data Config
    // Prepare trend data for the Line Chart
    const sortedYears = Object.keys(yearlyData).sort();
    const trendLabels = sortedYears.map(year => `20${year.split('-')[1]}`);
    const trendData = sortedYears.map(year => {
        const val = yearlyData[year].avgPackage.replace(/[^0-9.]/g, '');
        return parseFloat(val);
    });

    // Chart Data Config
    const lineData = {
        labels: trendLabels,
        datasets: [
            {
                label: 'Avg Package Trend',
                data: trendData,
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.5)',
                tension: 0.4,
            }
        ],
    };

    const barData = {
        labels: currentData.topCompanies.labels,
        datasets: [
            {
                label: `Hires in ${selectedYear}`,
                data: currentData.topCompanies.data,
                backgroundColor: '#4F46E5',
            },
        ],
    };

    const pieData = {
        labels: ['Computer', 'IT', 'E&TC'],
        datasets: [
            {
                data: currentData.deptDistribution,
                backgroundColor: ['#4F46E5', '#3B82F6', '#818CF8'],
                borderWidth: 1,
            },
        ],
    };

    const lineOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'LPA' }
            }
        }
    };

    return (
        <div className="dashboard-page" >
            <div className="page-header">
                <div>
                    <h2 className="page-title">Placement Analytics</h2>
                    <p className="page-subtitle">Overview of placement statistics and trends</p>
                </div>
                <div className="filter-controls">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm filter-container">
                        <Filter size={16} className="filter-icon" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium"
                        >
                            {Object.keys(yearlyData).reverse().map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">
                        <DollarSign size={24} />
                    </div>
                    <div className="metric-content">
                        <p className="metric-label">Average CTC</p>
                        <h3 className="metric-value">₹ {currentData.avgPackage}</h3>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">
                        <Target size={24} />
                    </div>
                    <div className="metric-content">
                        <p className="metric-label">Median CTC</p>
                        <h3 className="metric-value">₹ {currentData.medianPackage}</h3>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="metric-content">
                        <p className="metric-label">Highest CTC</p>
                        <h3 className="metric-value">₹ {currentData.highestPackage}</h3>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">
                        <Users size={24} />
                    </div>
                    <div className="metric-content">
                        <p className="metric-label">Total Placed</p>
                        <h3 className="metric-value">{currentData.totalPlaced}</h3>
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
        </div >
    );
};

export default Dashboard;
