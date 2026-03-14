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
import { Filter, IndianRupee, TrendingUp, Users, Target, BookOpen } from 'lucide-react';
import '../styles/Dashboard.css';
import { API_URL } from '../config';

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
    const [selectedBranch, setSelectedBranch] = React.useState('All');

    // Data extracted from Placement Reports (PDFs)
    const [yearlyData, setYearlyData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${API_URL}/api/placement-stats`);
                if (!response.ok) {
                    throw new Error('Failed to fetch placement stats');
                }
                const data = await response.json();
                setYearlyData(data);

                const years = Object.keys(data);
                if (years.length > 0) {
                    const sortedYears = [...years].sort((a, b) => b.localeCompare(a));
                    if (!years.includes(selectedYear)) {
                       setSelectedYear(sortedYears[0]);
                    } else if (selectedYear === '2023-24') {
                       setSelectedYear(sortedYears[0]);
                    }
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

    const displayData = selectedBranch === 'All' ? currentData : currentData.branchStats?.[selectedBranch] || currentData;

    // Prepare trend data for the Line Chart
    const sortedYears = Object.keys(yearlyData).sort();
    const trendLabels = sortedYears.map(year => `20${year.split('-')[1]}`);
    const trendData = sortedYears.map(year => {
        const root = selectedBranch === 'All' ? yearlyData[year] : (yearlyData[year].branchStats?.[selectedBranch] || yearlyData[year]);
        const val = String(root.avgPackage || "0").replace(/[^0-9.]/g, '');
        return parseFloat(val) || 0;
    });

    const lineData = {
        labels: trendLabels,
        datasets: [
            {
                label: `Avg Package Trend (${selectedBranch})`,
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
                label: `Total Hires in ${selectedYear}`,
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

    const branchLabelsMap = {
        'CE': 'Computer',
        'IT': 'IT',
        'E&TC': 'E&TC'
    };

    const compLabels = selectedBranch === 'All' ? ['Computer', 'IT', 'E&TC'] : [branchLabelsMap[selectedBranch]];
    const compKeys = selectedBranch === 'All' ? ['CE', 'IT', 'E&TC'] : [selectedBranch];

    const branchComparisonData = {
        labels: compLabels,
        datasets: [
            {
                label: 'Avg Package (LPA)',
                data: currentData.branchStats ? compKeys.map(k => 
                    parseFloat(String(currentData.branchStats[k].avgPackage).replace(/[^0-9.]/g, '')) || 0
                ) : [],
                backgroundColor: '#4F46E5',
            },
            {
                label: 'Median Package (LPA)',
                data: currentData.branchStats ? compKeys.map(k => 
                    parseFloat(String(currentData.branchStats[k].medianPackage).replace(/[^0-9.]/g, '')) || 0
                ) : [],
                backgroundColor: '#3B82F6',
            },
            {
                label: 'Highest Package (LPA)',
                data: currentData.branchStats ? compKeys.map(k => 
                    parseFloat(String(currentData.branchStats[k].highestPackage).replace(/[^0-9.]/g, '')) || 0
                ) : [],
                backgroundColor: '#818CF8',
            }
        ]
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
                <div className="filter-controls" style={{ display: 'flex', gap: '1rem' }}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm filter-container">
                        <BookOpen size={16} className="filter-icon" />
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium"
                        >
                            <option value="All">All Branches</option>
                            <option value="CE">Computer Engineering (CE)</option>
                            <option value="IT">Information Technology (IT)</option>
                            <option value="E&TC">E&TC</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm filter-container">
                        <Filter size={16} className="filter-icon" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium"
                        >
                            {Object.keys(yearlyData).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">
                        <IndianRupee size={24} />
                    </div>
                    <div className="metric-content">
                        <p className="metric-label">Average CTC</p>
                        <h3 className="metric-value">{String(displayData.avgPackage).includes('₹') ? displayData.avgPackage : `₹ ${displayData.avgPackage}`}</h3>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">
                        <Target size={24} />
                    </div>
                    <div className="metric-content">
                        <p className="metric-label">Median CTC</p>
                        <h3 className="metric-value">{String(displayData.medianPackage).includes('₹') ? displayData.medianPackage : `₹ ${displayData.medianPackage}`}</h3>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="metric-content">
                        <p className="metric-label">Highest CTC</p>
                        <h3 className="metric-value">{String(displayData.highestPackage).includes('₹') ? displayData.highestPackage : `₹ ${displayData.highestPackage}`}</h3>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">
                        <Users size={24} />
                    </div>
                    <div className="metric-content">
                        <p className="metric-label">Total Placed</p>
                        <h3 className="metric-value">{displayData.totalPlaced}</h3>
                    </div>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-card full-width">
                    <h3>Branch-wise Performance Comparison ({selectedYear})</h3>
                    <div className="chart-wrapper">
                        {currentData.branchStats ? (
                            <Bar data={branchComparisonData} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'LPA' } } } }} />
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>Data not available for branch comparison</div>
                        )}
                    </div>
                </div>

                <div className="chart-card full-width">
                    <h3>Year-wise Avg Package Trends ({selectedBranch})</h3>
                    <div className="chart-wrapper">
                        <Line options={lineOptions} data={lineData} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Overall Company-wise Hiring</h3>
                    <div className="chart-wrapper">
                        <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Overall Dept. Distribution</h3>
                    <div className="chart-wrapper pie-chart">
                        <Pie data={pieData} />
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Dashboard;
