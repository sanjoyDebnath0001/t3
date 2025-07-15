// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import ReportsPage from './ReportsPage';
import axiosInstance from '../setting/axiosInstance';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardSummary();
    }, []);

    const fetchDashboardSummary = async () => {
        setLoading(true);
        setError('');
        try {
            // Note: A more robust approach is to set the x-auth-token header globally
            // in axiosInstance configuration to avoid repeating this for every request.
            const token = localStorage.getItem('token');
            const config = {
                headers: { 'x-auth-token': token }
            };
            const res = await axiosInstance.get('/dashboard/summary', config);
            setDashboardData(res.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to fetch dashboard data.');
            setLoading(false);
            console.error(err);
        }
    };

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3">Loading your financial overview...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    const { totalIncome, totalExpenses, currentMonthBalance, budgetVsActual, recentTransactions } = dashboardData;

    return (
        <Container className="mt-5">
            <h1 className="text-center mb-4">Your Financial Overview</h1>

            <Row className="mb-4">
                <Col md={4}>
                    <Card className="text-center bg-success text-white">
                        <Card.Body>
                            <Card.Title>Total Income (This Month)</Card.Title>
                            <Card.Text as="h3">&#8377;{totalIncome.toFixed(2)}</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center bg-danger text-white">
                        <Card.Body>
                            <Card.Title>Total Expenses (This Month)</Card.Title>
                            <Card.Text as="h3">&#8377;{totalExpenses.toFixed(2)}</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center bg-primary text-white">
                        <Card.Body>
                            <Card.Title>Current Month Balance</Card.Title>
                            <Card.Text as="h3">&#8377;{currentMonthBalance.toFixed(2)}</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {budgetVsActual ? (
                <Card className="mb-4">
                    <Card.Body>
                        <Card.Title>Budget vs. Actual Spending ({budgetVsActual.budgetName})</Card.Title>
                        <Card.Subtitle className="mb-3 text-muted">
                            {new Date(budgetVsActual.budgetStartDate).toLocaleDateString()} - {new Date(budgetVsActual.budgetEndDate).toLocaleDateString()}
                        </Card.Subtitle>
                        <Row>
                            <Col md={6}>
                                <h5 className="text-info">Budgeted Expenses: &#8377;{budgetVsActual.totalBudgetedExpenses.toFixed(2)}</h5>
                            </Col>
                            <Col md={6}>
                                <h5 className="text-danger">Actual Expenses: &#8377;{budgetVsActual.totalActualExpenses.toFixed(2)}</h5>
                            </Col>
                        </Row>
                        <Alert variant={budgetVsActual.remainingBudget >= 0 ? 'success' : 'danger'} className="mt-3">
                            Remaining Budget: &#8377;{budgetVsActual.remainingBudget.toFixed(2)}
                        </Alert>

                        <h6 className="mt-4">Category Breakdown:</h6>
                        <ListGroup>
                            {budgetVsActual.categoryBreakdown.map((item, index) => (
                                <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                    {item.category}
                                    <div>
                                        <span className="badge bg-info me-2">Budgeted: &#8377;{item.budgeted.toFixed(2)}</span>
                                        <span className="badge bg-danger me-2">Spent: &#8377;{item.spent.toFixed(2)}</span>
                                        <span className={`badge ${item.remaining >= 0 ? 'bg-success' : 'bg-warning text-dark'}`}>Remaining: ${item.remaining.toFixed(2)}</span>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card.Body>
                </Card>
            ) : (
                <Alert variant="info" className="text-center">
                    No active monthly budget found for the current period. Create one in the "Budgets" section to see your spending compared to your plan!
                </Alert>
            )}

            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>Recent Transactions</Card.Title>
                    {recentTransactions.length === 0 ? (
                        <Alert variant="secondary">No recent transactions to display.</Alert>
                    ) : (
                        <ListGroup>
                            {recentTransactions.map(transaction => (
                                <ListGroup.Item key={transaction._id} className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>{transaction.description}</strong>
                                        <span className="text-muted ms-2">({transaction.category})</span>
                                        <br />
                                        {/* Corrected field name from transaction.date to transaction.transactionDate */}
                                        <small>{new Date(transaction.transactionDate).toLocaleDateString()}</small>
                                    </div>
                                    {/* Simplified amount display based on transaction type */}
                                    <h5 className={transaction.type === 'income' ? 'text-success' : 'text-danger'}>
                                        {transaction.type === 'income' ? '+' : '-'}
                                        &#8377;{transaction.amount.toFixed(2)}
                                    </h5>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Card.Body>
            </Card>
            <Card>
                <ReportsPage />
            </Card>
        </Container>
    );
};

export default Dashboard;