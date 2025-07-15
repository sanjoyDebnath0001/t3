import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button, Alert, Row, Col, Spinner, ListGroup } from 'react-bootstrap';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import axiosInstance from '../setting/axiosInstance';
import { useNavigate } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);


const ReportGenerator = () => {
    const navigate = useNavigate();

    const [reportType, setReportType] = useState('expenses-by-category');
    const [period, setPeriod] = useState('monthly');
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed for JS Date
    const [transactionFilterType, setTransactionFilterType] = useState('expense'); // NEW STATE for 'transaction-trends' type filter
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = [
        { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
        { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
        { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
        { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
    ];

    useEffect(() => {
        // Fetch report on initial load or when filters change
        // Added transactionFilterType to dependencies to re-fetch when it changes
        fetchReportData();
    }, [reportType, period, year, month, transactionFilterType]);

    const fetchReportData = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        setReportData(null); // Clear previous data

        const token = localStorage.getItem('token');

        if (!token) {
            setError('Authentication token not found. Please log in.');
            setLoading(false);
            setTimeout(() => {
                navigate('/login');
            }, 1500);
            return;
        }

        try {
            const config = {
                headers: { 'x-auth-token': token }
            };

            let url = `/dashboard/reports/${reportType}`;
            const params = new URLSearchParams();
            params.append('period', period);
            params.append('year', year);

            // FIX: Adjust month to be 1-indexed for backend if required
            if (period === 'monthly' || period === 'quarterly') {
                params.append('month', month + 1); // IMPORTANT: Add 1 for 1-indexed month
            }

            // FIX: Correctly append 'type' for transaction-trends using the new state
            if (reportType === 'transaction-trends') {
                if (!transactionFilterType) {
                    setError("Please select a transaction type (Expense/Income) for the trends report.");
                    setLoading(false);
                    return;
                }
                params.append('type', transactionFilterType);
            }

            url += `?${params.toString()}`;

            
            console.log('Constructed API Request URL:', url);
            console.log('Parameters being sent:', {
                reportType,
                period,
                year,
                month: (period === 'monthly' || period === 'quarterly') ? month + 1 : undefined, // Log 1-indexed month
                transactionFilterType: reportType === 'transaction-trends' ? transactionFilterType : undefined
            });
            // --- End Debugging Logs ---

            const res = await axiosInstance.get(url, config);
            setReportData(res.data);
            setLoading(false);
        } catch (err) {
            if (err.response) {
                console.error("API Error Response:", err.response.data); // Log full error response from backend
                console.error("API Error Status:", err.response.status);

                if (err.response.status === 401 || err.response.status === 403) {
                    setError('Session expired or unauthorized. Please log in again.');
                    localStorage.removeItem('token');
                    setTimeout(() => {
                        navigate('/login');
                    }, 1500);
                } else if (err.response.status === 400) {
                    setError(err.response.data.msg || 'Bad Request: Check your report parameters.'); // Display specific 400 message
                } else {
                    setError(err.response.data.msg || 'Failed to fetch report data.');
                }
            } else {
                setError('Network error or server unreachable.');
            }
            setLoading(false);
            console.error(err);
            
        }
    };

    // Chart Data and Options remain mostly the same, but ensure they use reportData values
    const getChartData = () => {
        if (!reportData) return {};

        switch (reportType) {
            case 'expenses-by-category':
            case 'income-by-category':
                const categoryData = reportType === 'expenses-by-category' ? reportData.expensesByCategory : reportData.incomeByCategory;
                if (!categoryData || categoryData.length === 0) return {};
                const labels = categoryData.map(item => item._id);
                const data = categoryData.map(item => item.totalAmount);
                const backgroundColor = data.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`);
                const borderColor = backgroundColor.map(color => color.replace('0.6', '1'));

                return {
                    labels: labels,
                    datasets: [{
                        label: `Total Amount (${reportType === 'expenses-by-category' ? 'Expenses' : 'Income'})`,
                        data: data,
                        backgroundColor: backgroundColor,
                        borderColor: borderColor,
                        borderWidth: 1,
                    }]
                };
            case 'transaction-trends':
                // Use `transactionFilterType` for label in chart, but `reportData.type` for data (which should match)
                const trendReportData = reportData.trends;
                if (!trendReportData || trendReportData.length === 0) return {};

                const trendLabels = trendReportData.map(item => item._id);
                const trendAmounts = trendReportData.map(item => item.totalAmount);
                const trendColor = transactionFilterType === 'expense' ? 'rgba(255, 99, 132, 0.8)' : 'rgba(75, 192, 192, 0.8)';
                const trendBorderColor = transactionFilterType === 'expense' ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)';

                return {
                    labels: trendLabels,
                    datasets: [{
                        label: `${transactionFilterType.charAt(0).toUpperCase() + transactionFilterType.slice(1)} Trend`,
                        data: trendAmounts,
                        fill: false,
                        borderColor: trendBorderColor,
                        backgroundColor: trendColor,
                        tension: 0.1
                    }]
                };
            default:
                return {};
        }
    };

    const getChartOptions = (chartTitle) => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: chartTitle,
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
                        }
                    }
                }
            }
        };
    };

    const handleExportCSV = () => {
        if (!reportData) {
            setError("No data to export.");
            return;
        }

        let csvContent = "";
        let filename = `${reportType}-report.csv`;

        if (reportType === 'expenses-by-category' && reportData.expensesByCategory) {
            csvContent += "Category,Total Amount,Count\n";
            reportData.expensesByCategory.forEach(item => {
                csvContent += `${item._id},${item.totalAmount.toFixed(2)},${item.count}\n`;
            });
        } else if (reportType === 'income-by-category' && reportData.incomeByCategory) {
            csvContent += "Category,Total Amount,Count\n";
            reportData.incomeByCategory.forEach(item => {
                csvContent += `${item._id},${item.totalAmount.toFixed(2)},${item.count}\n`;
            });
        } else if (reportType === 'transaction-trends' && reportData.trends) {
            csvContent += "Period,Total Amount\n";
            reportData.trends.forEach(item => {
                csvContent += `${item._id},${item.totalAmount.toFixed(2)}\n`;
            });
            filename = `${transactionFilterType}-trends-${period}-report.csv`; // Use filter type for filename
        } else {
            setError("Unsupported report type for CSV export or no data.");
            return;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setMessage("Report exported to CSV!");
    };


    return (
        <Container className="mt-5">
            <Card className="mb-4">
                <Card.Body>
                    <h2 className="text-center mb-4">Financial Reports & Analytics</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {message && <Alert variant="success">{message}</Alert>}

                    <Form>
                        <Row className="mb-3 align-items-end">
                            <Col md={4}>
                                <Form.Group controlId="reportType">
                                    <Form.Label>Select Report</Form.Label>
                                    <Form.Select value={reportType} onChange={e => setReportType(e.target.value)}>
                                        <option value="expenses-by-category">Expenses by Category</option>
                                        <option value="income-by-category">Income by Category</option>
                                        <option value="transaction-trends">Transaction Trends</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group controlId="period">
                                    <Form.Label>Period</Form.Label>
                                    <Form.Select value={period} onChange={e => setPeriod(e.target.value)}>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="annually">Annually</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group controlId="year">
                                    <Form.Label>Year</Form.Label>
                                    <Form.Select value={year} onChange={e => setYear(e.target.value)}>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {(period === 'monthly' || period === 'quarterly') && (
                                <Col md={3}>
                                    <Form.Group controlId="month">
                                        <Form.Label>Month (for Monthly/Quarterly)</Form.Label>
                                        <Form.Select value={month} onChange={e => setMonth(e.target.value)}>
                                            {months.map(m => (
                                                <option key={m.value} value={m.value}>{m.name}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            )}
                            {/* FIX: Use the new transactionFilterType state for this dropdown */}
                            {reportType === 'transaction-trends' && (
                                <Col md={3}>
                                    <Form.Group controlId="trendType">
                                        <Form.Label>Transaction Type</Form.Label>
                                        <Form.Select
                                            value={transactionFilterType}
                                            onChange={e => setTransactionFilterType(e.target.value)}
                                        >
                                            <option value="">Select Type</option> {/* Allow selecting empty if optional backend */}
                                            <option value="expense">Expense</option>
                                            <option value="income">Income</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {loading && (
                <div className="text-center mt-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading report...</span>
                    </Spinner>
                    <p className="mt-3">Generating your report...</p>
                </div>
            )}

            {!loading && reportData && (
                <Card className="mt-4">
                    <Card.Body>
                        <h3 className="mb-4 text-center">Report Results</h3>
                        {reportData.startDate && reportData.endDate && (
                            <p className="text-center text-muted">
                                Data from: {new Date(reportData.startDate).toLocaleDateString()} to {new Date(reportData.endDate).toLocaleDateString()}
                            </p>
                        )}
                        <hr />

                        {/* Render Charts */}
                        {reportType === 'expenses-by-category' && reportData.expensesByCategory && reportData.expensesByCategory.length > 0 && (
                            <>
                                <h4 className="mt-4">Expenses by Category Chart</h4>
                                <div style={{ height: '400px' }}>
                                    <Pie data={getChartData()} options={getChartOptions('Expenses by Category')} />
                                </div>
                                <h5 className="mt-4">Detailed Breakdown:</h5>
                                <ListGroup>
                                    {reportData.expensesByCategory.map((item, index) => (
                                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                            {item._id}:
                                            <span className="badge bg-danger">${item.totalAmount.toFixed(2)} ({item.count} items)</span>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </>
                        )}

                        {reportType === 'income-by-category' && reportData.incomeByCategory && reportData.incomeByCategory.length > 0 && (
                            <>
                                <h4 className="mt-4">Income by Category Chart</h4>
                                <div style={{ height: '400px' }}>
                                    <Pie data={getChartData()} options={getChartOptions('Income by Category')} />
                                </div>
                                <h5 className="mt-4">Detailed Breakdown:</h5>
                                <ListGroup>
                                    {reportData.incomeByCategory.map((item, index) => (
                                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                            {item._id}:
                                            <span className="badge bg-success">${item.totalAmount.toFixed(2)} ({item.count} items)</span>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </>
                        )}

                        {reportType === 'transaction-trends' && reportData.trends && reportData.trends.length > 0 && (
                            <>
                                <h4 className="mt-4">{transactionFilterType.charAt(0).toUpperCase() + transactionFilterType.slice(1)} Trends Over Time</h4>
                                <div style={{ height: '400px' }}>
                                    <Line data={getChartData()} options={getChartOptions(`${transactionFilterType.charAt(0).toUpperCase() + transactionFilterType.slice(1)} Trends`)} />
                                </div>
                                <h5 className="mt-4">Detailed Trends:</h5>
                                <ListGroup>
                                    {reportData.trends.map((item, index) => (
                                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                            {item._id}:
                                            <span className={`badge ${transactionFilterType === 'income' ? 'bg-success' : 'bg-danger'}`}>
                                                ${item.totalAmount.toFixed(2)}
                                            </span>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </>
                        )}

                        {/* No data message */}
                        {((reportType === 'expenses-by-category' && (!reportData.expensesByCategory || reportData.expensesByCategory.length === 0)) ||
                            (reportType === 'income-by-category' && (!reportData.incomeByCategory || reportData.incomeByCategory.length === 0)) ||
                            (reportType === 'transaction-trends' && (!reportData.trends || reportData.trends.length === 0))) && (
                                <Alert variant="info" className="text-center mt-4">
                                    No data found for the selected criteria. Try adjusting the filters or adding more transactions.
                                </Alert>
                            )}

                        {/* Export Button */}
                        <div className="d-grid gap-2 mt-4">
                            <Button variant="outline-dark" onClick={handleExportCSV}>
                                Export to CSV
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default ReportGenerator;