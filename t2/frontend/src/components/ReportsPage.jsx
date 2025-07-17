// frontend/src/components/ReportsPage.jsx
import React, { useState } from 'react';
// axios is typically imported if you're using it directly, but axiosInstance
// usually wraps it. Keeping it commented out if axiosInstance is sufficient.
// import axios from 'axios';
import { Container, Card, Button, Form, Alert, Row, Col, ListGroup, Tab, Tabs, Spinner } from 'react-bootstrap';
import axiosInstance from '../setting/axiosInstance'; // Make sure this path is correct
import ReportGenerator from './ReportGenerator'; // Assuming this component handles the 'dynamic-reports' tab
import { useNavigate } from 'react-router-dom';

const ReportsPage = () => {
    const navigate = useNavigate(); // For navigation on auth errors

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [spendingReport, setSpendingReport] = useState(null); // Stores expenses by category
    const [incomeReport, setIncomeReport] = useState(null);   // Stores income by category
    const [netIncomeReport, setNetIncomeReport] = useState(null);
    const [loadingDateRange, setLoadingDateRange] = useState(false); // Specific loading state for date range tab
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('date-range'); // Default to 'date-range' reports

    // Helper function to safely format numbers, preventing 'toFixed is not a function'
    const formatCurrency = (amount) => {
        // Ensure amount is a number, default to 0 if null/undefined/non-numeric
        const numericAmount = typeof amount === 'number' ? amount : 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numericAmount);
    };

    // A single function to fetch any report type for the 'date-range' tab
    const fetchDateRangeReport = async (reportType) => {
        setLoadingDateRange(true);
        setError(''); // Clear errors before new fetch

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Authentication token not found. Please log in.');
            setLoadingDateRange(false);
            // Optionally redirect to login
            navigate('/login');
            return;
        }

        try {
            const config = {
                headers: { 'x-auth-token': token },
                params: {
                    startDate,
                    endDate,
                }
            };

            const url = `/reports/${reportType}`; // e.g., /reports/expenses-by-category, /reports/income-by-category, /reports/net-income

            const res = await axiosInstance.get(url, config);

            // Based on the reportType, update the correct state
            if (reportType === 'expenses-by-category') {
                // Ensure data is an array, default to empty array if not found or null
                setSpendingReport(Array.isArray(res.data.expensesByCategory) ? res.data.expensesByCategory : []);
            } else if (reportType === 'income-by-category') {
                // Ensure data is an array, default to empty array if not found or null
                setIncomeReport(Array.isArray(res.data.incomeByCategory) ? res.data.incomeByCategory : []);
            } else if (reportType === 'net-income') {
                
                setNetIncomeReport({
                    totalIncome: typeof res.data.totalIncome === 'number' ? res.data.totalIncome : 0,
                    totalExpenses: typeof res.data.totalExpenses === 'number' ? res.data.totalExpenses : 0,
                    netIncome: typeof res.data.netIncome === 'number' ? res.data.netIncome : 0,
                });
            }
        } catch (err) {
            console.error(`Failed to fetch ${reportType} report:`, err);
            if (err.response) {
                if (err.response.status === 401 || err.response.status === 403) {
                    setError('Session expired or unauthorized. Please log in again.');
                    localStorage.removeItem('token');
                    setTimeout(() => navigate('/login'), 1500);
                } else if (err.response.status === 404) {
                    setError(`Report endpoint for ${reportType} not found. Please check backend routes.`);
                } else {
                    setError(err.response.data?.msg || `Failed to fetch ${reportType} report.`);
                }
            } else {
                setError('Network error or server unreachable. Please check your internet connection.');
            }
        } finally {
            setLoadingDateRange(false);
        }
    };

    const handleGenerateReports = () => {
        if (!startDate || !endDate) {
            setError('Please select both start and end dates.');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError('Start date cannot be after end date.');
            return;
        }
        setError(''); // Clear previous errors

        // Only generate reports if on the 'date-range' tab
        if (activeTab === 'date-range') {
            fetchDateRangeReport('expenses-by-category');
            fetchDateRangeReport('income-by-category');
            fetchDateRangeReport('net-income');
        }
    };

    const renderSpendingReport = () => {
        const reportData = spendingReport; // This is already an array due to handling in fetchDateRangeReport

        if (reportData === null) return <Alert variant="info" className="mt-3 text-center">Select dates and click "Generate Reports" to view spending by category.</Alert>;
        // No need for Array.isArray(reportData) check here if fetchDateRangeReport ensures it's an array
        if (reportData.length === 0) return <Alert variant="warning" className="mt-3 text-center">No expenses found for the selected period.</Alert>;

        const totalSpent = reportData.reduce((acc, item) => acc + (typeof item.totalAmount === 'number' ? item.totalAmount : 0), 0);

        return (
            <div className="mt-3">
                <h5 className="mb-3 text-center">Total Spent: {formatCurrency(totalSpent)}</h5>
                <ListGroup>
                    {reportData.map(item => (
                        <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center">
                            {item._id}
                            <span className="badge bg-danger">{formatCurrency(item.totalAmount)}</span>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </div>
        );
    };

    const renderIncomeReport = () => {
        const reportData = incomeReport; // This is already an array due to handling in fetchDateRangeReport

        if (reportData === null) return <Alert variant="info" className="mt-3 text-center">Select dates and click "Generate Reports" to view income by category.</Alert>;
        // No need for Array.isArray(reportData) check here if fetchDateRangeReport ensures it's an array
        if (reportData.length === 0) return <Alert variant="warning" className="mt-3 text-center">No income found for the selected period.</Alert>;

        const totalReceived = reportData.reduce((acc, item) => acc + (typeof item.totalAmount === 'number' ? item.totalAmount : 0), 0);

        return (
            <div className="mt-3">
                <h5 className="mb-3 text-center">Total Received: {formatCurrency(totalReceived)}</h5>
                <ListGroup>
                    {reportData.map(item => (
                        <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center">
                            {item._id}
                            <span className="badge bg-success">{formatCurrency(item.totalAmount)}</span>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </div>
        );
    };

    const renderNetIncomeReport = () => {
        if (netIncomeReport === null) return <Alert variant="info" className="mt-3 text-center">Select dates and click "Generate Reports" to view net income.</Alert>;
        // The fetchDateRangeReport now ensures netIncomeReport has default numeric values.

        const { totalIncome: netTotalIncome, totalExpenses: netTotalExpenses, netIncome: calculatedNetIncome } = netIncomeReport;

        return (
            <div className="mt-3 text-center">
                <p><strong>Total Income:</strong> <span className="text-success">{formatCurrency(netTotalIncome)}</span></p>
                <p><strong>Total Expenses:</strong> <span className="text-danger">{formatCurrency(netTotalExpenses)}</span></p>
                <Alert variant={calculatedNetIncome >= 0 ? 'success' : 'danger'} className="mt-3">
                    <h4>Net Income/Loss: {formatCurrency(calculatedNetIncome)}</h4>
                </Alert>
            </div>
        );
    };

    return (
        <Container className="mt-5">
            <h1 className="text-center mb-4">Financial Reports</h1>

            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Card.Title className="mb-3 text-primary">Select Report Period</Card.Title>
                    {error && <Alert variant="danger" className="text-center">{error}</Alert>}
                    <Tabs
                        id="report-tabs"
                        activeKey={activeTab}
                        onSelect={(k) => {
                            setActiveTab(k);
                            setError(''); // Clear error when switching tabs
                            setLoadingDateRange(false); // Only stop loading for date range tab
                            // Reset reports when switching away from date-range tab
                            if (k !== 'date-range') {
                                setSpendingReport(null);
                                setIncomeReport(null);
                                setNetIncomeReport(null);
                            }
                        }}
                        className="mb-3"
                        fill // Makes tabs take full width
                    >
                        <Tab eventKey="date-range" title="Date Range Reports">
                            <Form className="mt-3">
                                <Row className="align-items-end">
                                    <Col md={5}>
                                        <Form.Group controlId="startDate">
                                            <Form.Label>Start Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={5}>
                                        <Form.Group controlId="endDate">
                                            <Form.Label>End Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Button
                                            variant="primary"
                                            onClick={handleGenerateReports}
                                            className="w-100"
                                            disabled={loadingDateRange} // Disable if loading
                                        >
                                            {loadingDateRange ? <Spinner animation="border" size="sm" /> : 'Generate Reports'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>

                            {/* Render date-range report details within this tab */}
                            {loadingDateRange && (
                                <div className="text-center mt-3">
                                    <Spinner animation="border" role="status" variant="primary">
                                        <span className="visually-hidden">Loading date range reports...</span>
                                    </Spinner>
                                    <p className="mt-2 text-muted">Generating your date range reports...</p>
                                </div>
                            )}

                            {!loadingDateRange && (
                                <Card className="mt-4 shadow-sm">
                                    <Card.Body>
                                        <h3 className="mb-4 text-center text-secondary">Date Range Report Results</h3>
                                        <Tabs
                                            id="date-range-sub-tabs"
                                            activeKey={
                                                // Prioritize which tab to open if data exists
                                                (spendingReport !== null && spendingReport.length > 0 && 'spending') ||
                                                (incomeReport !== null && incomeReport.length > 0 && 'income') ||
                                                (netIncomeReport !== null && (netIncomeReport.totalIncome !== 0 || netIncomeReport.totalExpenses !== 0) && 'net-income') ||
                                                'spending' // Default to spending if no report data yet
                                            }
                                            // No specific onSelect for sub-tabs needed unless you want to log or change something
                                            className="mb-3"
                                            fill
                                        >
                                            <Tab eventKey="spending" title="Spending by Category">
                                                {renderSpendingReport()}
                                            </Tab>
                                            <Tab eventKey="income" title="Income by Category">
                                                {renderIncomeReport()}
                                            </Tab>
                                            <Tab eventKey="net-income" title="Net Income/Loss">
                                                {renderNetIncomeReport()}
                                            </Tab>
                                        </Tabs>
                                    </Card.Body>
                                </Card>
                            )}
                        </Tab>

                        <Tab eventKey="dynamic-reports" title="Dynamic Reports">
                            {/* The ReportGenerator component handles its own state and API calls */}
                            <ReportGenerator />
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ReportsPage;