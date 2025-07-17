// frontend/src/components/ReportGenerator.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Still import axios, though axiosInstance is preferred
import { Container, Card, Form, Button, Alert, Row, Col, Spinner, ListGroup } from 'react-bootstrap';
import { Line } from 'react-chartjs-2'; // Only Line chart needed now
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'; // Removed BarElement, ArcElement
import axiosInstance from '../setting/axiosInstance';
import { useNavigate } from 'react-router-dom';

// Register Chart.js components - updated to only include what's needed for Line chart
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ReportGenerator = () => {
    const navigate = useNavigate();

    // State for report generation parameters
    const [reportType, setReportType] = useState('transaction-trends'); 
    const [period, setPeriod] = useState('monthly');
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed for JS Date
    // New states for custom date range
    const [startDate, setStartDate] = useState(''); // YYYY-MM-DD format for input type="date"
    const [endDate, setEndDate] = useState(''); // YYYY-MM-DD format for input type="date"
    // transactionTrendsFilterType remains, as it's for the only remaining report type
    const [transactionFilterType, setTransactionFilterType] = useState(null);

    // State for fetched report data and UI feedback
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // Used for success messages or specific info alerts

    const currentYear = new Date().getFullYear();
    // Generate years for dropdown: current year and the past 4 years
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = [
        { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
        { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
        { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
        { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, 'name': 'December' }
    ];

    // useCallback to memoize fetchReportData, preventing unnecessary re-creations
    // This is especially useful if it were passed down to child components
    const fetchReportData = useCallback(async () => {
        setLoading(true);
        setError('');
        setMessage('');
        setReportData(null); // Clear previous data before new fetch

        const token = localStorage.getItem('token');

        if (!token) {
            setError('Authentication token not found. Please log in.');
            setLoading(false);
            setTimeout(() => {
                navigate('/login');
            }, 1500);
            return;
        }

        let url = '';
        // Only transaction-trends case remains
        if (reportType === 'transaction-trends') {
            url = '/reports/transaction-trends';
        } else {
            // This case should ideally not be hit with the updated reportType state default
            setError('Invalid report type selected.');
            setLoading(false);
            return;
        }

        try {
            const requestParams = {};

            // Determine parameters based on the selected period
            if (period === 'custom') {
                if (!startDate || !endDate) {
                    setError('Please select both start and end dates for a custom range.');
                    setLoading(false);
                    return;
                }
                if (new Date(startDate) > new Date(endDate)) {
                    setError('Start date cannot be after end date.');
                    setLoading(false);
                    return;
                }
                requestParams.period = period; // Send 'custom'
                requestParams.startDate = startDate;
                requestParams.endDate = endDate;
            } else {
                requestParams.period = period;
                requestParams.year = year;
                if (period === 'monthly' || period === 'quarterly') {
                    requestParams.month = month + 1; // IMPORTANT: Add 1 for 1-indexed month
                }
            }

            // Conditionally append 'type' for 'transaction-trends' report
            if (reportType === 'transaction-trends') {
                if (!transactionFilterType) {
                    setError("Please select a transaction type (Expense/Income) for the trends report.");
                    setLoading(false);
                    return;
                }
                requestParams.type = transactionFilterType;
            }

            const config = {
                headers: { 'x-auth-token': token },
                params: requestParams // Pass the parameters object here
            };

            const res = await axiosInstance.get(url, config);
            setReportData(res.data);
            setLoading(false);
            // Optionally set a success message here if data is received
            if (res.data && Object.keys(res.data).length > 0) {
                setMessage('Report data loaded successfully.');
            } else {
                setMessage('No data found for the selected criteria. Try adjusting the filters or adding more transactions.');
            }

        } catch (err) {
            if (err.response) {
                console.error("API Error Response:", err.response.data); // Log full error response from backend
                console.error("API Error Status:", err.response.status);

                if (err.response.status === 401 || err.response.status === 403) {
                    setError('Session expired or unauthorized. Please log in again.');
                    localStorage.removeItem('token'); // Clear invalid token
                    setTimeout(() => {
                        navigate('/login');
                    }, 1500);
                } else if (err.response.status === 400) {
                    setError(err.response.data.msg || 'Bad Request: Check your report parameters.'); // Display specific 400 message
                } else if (err.response.status === 404) {
                    setError('Report endpoint not found. This might be a backend routing issue or incorrect report type. Check the URL and backend routes.');
                }
                else {
                    setError(err.response.data.msg || 'Failed to fetch report data.');
                }
            } else {
                setError('Network error or server unreachable. Please check your internet connection.');
            }
            setLoading(false);
            console.error(err);
        }
    }, [reportType, period, year, month, startDate, endDate, transactionFilterType, navigate]); // Added startDate, endDate to deps

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const getChartData = () => {
        if (!reportData) return {};

        // Only transaction-trends case remains
        if (reportType === 'transaction-trends') {
            const trendReportData = reportData.trends;
            if (!trendReportData || trendReportData.length === 0) {
                return {};
            }

            // For custom periods, trend _id might be dates like YYYY-MM-DD.
            // Ensure the backend groups trends appropriately for custom ranges.
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
        }
        return {}; // Should not be reached with the current reportType state
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
                                return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
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
                            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
                        }
                    }
                }
            }
        };
    };

    const handleExportCSV = () => {
        let dataToExport = [];
        let filename = `${reportType}-report.csv`;
        let headers = "";

        // Only transaction-trends export logic remains
        if (reportType === 'transaction-trends' && reportData?.trends?.length > 0) {
            dataToExport = reportData.trends;
            headers = "Period,Total Amount\n";
            // Adjust filename for custom ranges if needed, e.g., include dates
            filename = `${transactionFilterType}-trends-${period === 'custom' ? `${startDate}_to_${endDate}` : period}-report.csv`;
        } else {
            setError("No data found for the selected report type to export.");
            return;
        }

        if (dataToExport.length === 0) {
            setError("No data found for the selected criteria to export.");
            return;
        }

        let csvContent = headers;
        dataToExport.forEach(item => {
            if (reportType === 'transaction-trends') {
                // Ensure _id for trends is suitable for CSV (e.g., date string)
                csvContent += `${item._id},${item.totalAmount.toFixed(2)}\n`;
            }
        });

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
            setMessage("Report exported to CSV successfully!");
        } else {
            setError("Your browser does not support downloading files directly.");
        }
    };

    // Simplify hasReportData check
    const hasReportData = reportData && (reportType === 'transaction-trends' && reportData.trends && reportData.trends.length > 0);

    return (
        <Container className="mt-5">
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <h2 className="text-center mb-4 text-primary">Financial Reports & Analytics</h2>
                    {error && <Alert variant="danger" className="text-center">{error}</Alert>}
                    {message && !error && <Alert variant="info" className="text-center">{message}</Alert>}

                    <Form>
                        <Row className="mb-3 align-items-end">
                            <Col md={4}>
                                <Form.Group controlId="reportType">
                                    <Form.Label>Select Report</Form.Label>
                                    <Form.Select
                                        value={reportType}
                                        onChange={e => {
                                            setReportType(e.target.value);
                                            // No need for conditional logic here as only one report type is available
                                        }}
                                        disabled // Disable the report type selection as only one option remains
                                    >
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
                                        <option value="custom">Custom Range</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {period !== 'custom' && (
                                <>
                                    <Col md={2}>
                                        <Form.Group controlId="year">
                                            <Form.Label>Year</Form.Label>
                                            <Form.Select value={year} onChange={e => setYear(Number(e.target.value))}>
                                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    {(period === 'monthly' || period === 'quarterly') && (
                                        <Col md={3}>
                                            <Form.Group controlId="month">
                                                <Form.Label>Month (for Monthly/Quarterly)</Form.Label>
                                                <Form.Select value={month} onChange={e => setMonth(Number(e.target.value))}>
                                                    {months.map(m => (
                                                        <option key={m.value} value={m.value}>{m.name}</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    )}
                                </>
                            )}

                            {period === 'custom' && (
                                <>
                                    <Col md={3}>
                                        <Form.Group controlId="startDate">
                                            <Form.Label>Start Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={startDate}
                                                onChange={e => setStartDate(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group controlId="endDate">
                                            <Form.Label>End Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={endDate}
                                                onChange={e => setEndDate(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </>
                            )}

                            {reportType === 'transaction-trends' && (
                                <Col md={3}>
                                    <Form.Group controlId="trendType">
                                        <Form.Label>Transaction Type</Form.Label>
                                        <Form.Select
                                            value={transactionFilterType}
                                            onChange={e => setTransactionFilterType(e.target.value)}
                                        >
                                            <option value="expense">Expense</option>
                                            <option value="income">Income</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>
                        <Row>
                            <Col className="d-grid">
                                <Button
                                    variant="primary"
                                    onClick={fetchReportData}
                                    disabled={loading}
                                >
                                    {loading ? <Spinner animation="border" size="sm" /> : 'Generate Report'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {loading && (
                <div className="text-center mt-5">
                    <Spinner animation="border" role="status" variant="primary">
                        <span className="visually-hidden">Loading report...</span>
                    </Spinner>
                    <p className="mt-3 text-muted">Generating your report, please wait...</p>
                </div>
            )}

            {!loading && reportData && (
                <Card className="mt-4 shadow-sm">
                    <Card.Body>
                        <h3 className="mb-4 text-center text-secondary">Report Results</h3>
                        {reportData.startDate && reportData.endDate && (
                            <p className="text-center text-muted">
                                Data from: {new Date(reportData.startDate).toLocaleDateString()} to {new Date(reportData.endDate).toLocaleDateString()}
                            </p>
                        )}
                        <hr />

                        {reportType === 'transaction-trends' && reportData.trends?.length > 0 && (
                            <>
                                <h4 className="mt-4 text-center text-info">{transactionFilterType.charAt(0).toUpperCase() + transactionFilterType.slice(1)} Trends Over Time</h4>
                                <div style={{ height: '400px' }} className="mb-4">
                                    <Line data={getChartData()} options={getChartOptions(`${transactionFilterType.charAt(0).toUpperCase() + transactionFilterType.slice(1)} Trends`)} />
                                </div>
                                <h5 className="mt-4">Detailed Trends:</h5>
                                <ListGroup className="mb-4">
                                    {reportData.trends.map((item, index) => (
                                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                            <strong>{item._id}:</strong>
                                            <span className={`badge ${transactionFilterType === 'income' ? 'bg-success' : 'bg-danger'}`}>
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.totalAmount)}
                                            </span>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </>
                        )}

                        {!hasReportData && !loading && (
                            <Alert variant="info" className="text-center mt-4">
                                No data found for the selected criteria. Try adjusting the filters or adding more transactions.
                            </Alert>
                        )}

                        <div className="d-grid gap-2 mt-4">
                            <Button
                                variant="outline-dark"
                                onClick={handleExportCSV}
                                disabled={!hasReportData || loading}
                            >
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