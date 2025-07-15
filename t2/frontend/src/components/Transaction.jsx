

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Button, Modal, Form, Alert, Row, Col, Card, ProgressBar, Spinner } from 'react-bootstrap';
import axiosInstance from '../setting/axiosInstance';
import AddTransactionModal from './AddTransactionModal';


const formatDate = (date) => {
	const d = new Date(date);
	let month = '' + (d.getMonth() + 1);
	let day = '' + d.getDate();
	const year = d.getFullYear();

	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;

	return [year, month, day].join('-');
};

const Income = () => {
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// State for date filtering
	const [startDate, setStartDate] = useState(() => {
		const today = new Date();
		const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		return formatDate(firstDayOfMonth);
	});
	const [endDate, setEndDate] = useState(() => {
		const today = new Date();
		return formatDate(today);
	});

	// State for Financial Overview (Income vs Expense)
	const [totalIncome, setTotalIncome] = useState(0);
	const [totalExpense, setTotalExpense] = useState(0);

	// State for Add Transaction Modal visibility
	const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
	const handleCloseAddTransactionModal = () => setShowAddTransactionModal(false);
	const handleShowAddTransactionModal = () => setShowAddTransactionModal(true);

	// --- Combined Data Fetching Function ---
	const fetchAllData = useCallback(async (start, end) => {
		setLoading(true);
		setError(null);
		try {
			// Fetch income transactions
			const incomeRes = await axiosInstance.get('/transactions', {
				params: {
					type: 'income', // Although the endpoint fetches all, we might filter on frontend if needed
					startDate: start,
					endDate: end,
				}
			});
			// Filter only income transactions for display in this component
			setTransactions(incomeRes.data.filter(t => t.type === 'income'));

			// Fetch report data for financial overview
			const validStartDate = new Date(start);
			const validEndDate = new Date(end);
			validEndDate.setHours(23, 59, 59, 999); // Ensure end of day

			const reportRes = await axiosInstance.get('/reports/income-vs-expense', {
				params: {
					startDate: validStartDate.toISOString(),
					endDate: validEndDate.toISOString(),
				}
			});
			setTotalIncome(reportRes.data.totalIncome || 0);
			setTotalExpense(reportRes.data.totalExpense || 0);

		} catch (err) {
			console.error('Error fetching data for Income page:', err);
			setTransactions([]);
			setTotalIncome(0);
			setTotalExpense(0);
			if (err.response && err.response.data && err.response.data.message) {
				setError(`Failed to fetch data: ${err.response.data.message}`);
			} else {
				setError('Failed to fetch data. Please try again.');
			}
		} finally {
			setLoading(false);
		}
	}, []); // Dependencies are empty as it's meant to be triggered by state changes

	useEffect(() => {
		// Initial fetch of data when component mounts or dates change
		fetchAllData(startDate, endDate);
	}, [startDate, endDate, fetchAllData]); // Re-fetch when dates or fetchAllData changes

	const handleApplyFilter = () => {
		// This will trigger the useEffect to re-fetch with new dates
		fetchAllData(startDate, endDate);
	};

	const calculateProgressNow = () => {
		if (totalIncome === 0 && totalExpense === 0) return 0;
		if (totalIncome === 0) return 100; // If no income, expenses are 100% of income

		let percentage = (totalExpense / totalIncome) * 100;
		return Math.min(100, Math.max(0, percentage)); // Ensure percentage is between 0 and 100
	};

	const progressNow = calculateProgressNow();

	// Callback for when a transaction is successfully added from the modal
	const handleTransactionAdded = () => {
		fetchAllData(startDate, endDate); // Re-fetch all data to update the view
	};

	// Placeholder for view/edit/delete transaction - will be implemented later
	const handleViewTransaction = (id) => {
		alert(`View transaction with ID: ${id}`);
		// Implement navigation to a detailed transaction view or open a view modal
	};

	const handleEditTransaction = (id) => {
		alert(`Edit transaction with ID: ${id}`);
		// Implement logic to populate edit modal or navigate to edit page
	};

	const handleDeleteTransaction = async (id) => {
		if (window.confirm('Are you sure you want to delete this transaction? This cannot be undone.')) {
			try {
				await axiosInstance.delete(`/transactions/${id}`);
				alert('Transaction deleted successfully!');
				fetchAllData(startDate, endDate); // Refresh data after deletion
			} catch (err) {
				console.error('Error deleting transaction:', err.response ? err.response.data : err);
				setError(err.response?.data?.message || 'Failed to delete transaction. Please try again.');
			}
		}
	};


	if (loading) {
		return (
			<Container className="mt-5 text-center">
				<Spinner animation="border" role="status">
					<span className="visually-hidden">Loading...</span>
				</Spinner>
				<p>Loading income data...</p>
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

	return (
		<Container className="mt-5">
			<h2 className="mb-4">Your Income Transactions</h2>

			<div className="d-flex justify-content-end mb-3">
				<Button variant="success" onClick={handleShowAddTransactionModal}>
					Add New Transaction
				</Button>
			</div>

			{/* Date Filtering Section */}
			<Card className="p-3 mb-4 shadow-sm">
				<Card.Title className="mb-3">Filter Transactions by Date</Card.Title>
				<Row className="g-3 align-items-end">
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
						<Button variant="info" onClick={handleApplyFilter} className="w-100">
							Apply Filter
						</Button>
					</Col>
				</Row>
			</Card>

			{transactions.length === 0 ? (
				<Alert variant="info">No income transactions found for the selected period. Add one now!</Alert>
			) : (
				<div className="row">
					{transactions.map(transaction => (
						<div key={transaction._id} className="col-md-6 col-lg-4 mb-4">
							<Card className="shadow-sm h-100">
								<Card.Body className="d-flex flex-column">
									<Card.Title className="mb-1">{transaction.category}</Card.Title>
									<Card.Subtitle className="mb-2 text-muted">
										{new Date(transaction.date).toLocaleDateString()}
									</Card.Subtitle>
									<Card.Text className="mb-2">
										<strong>Amount:</strong> {transaction.account?.currency || ''} {transaction.amount.toFixed(2)}
									</Card.Text>
									<Card.Text className="mb-2">
										<strong>Account:</strong> {transaction.account?.name || 'N/A'}
									</Card.Text>
									{transaction.description && (
										<Card.Text className="text-muted small">
											{transaction.description}
										</Card.Text>
									)}
									<div className="mt-auto d-flex justify-content-start gap-2 pt-2">
										<Button variant="info" size="sm" onClick={() => handleViewTransaction(transaction._id)}>View</Button>
										<Button variant="secondary" size="sm" onClick={() => handleEditTransaction(transaction._id)}>Edit</Button>
										<Button variant="danger" size="sm" onClick={() => handleDeleteTransaction(transaction._id)}>Delete</Button>
									</div>
								</Card.Body>
							</Card>
						</div>
					))}
				</div>
			)}

			{/* Financial Overview Section (moved from Accounts.jsx to here) */}
			<div className="mt-5">
				<h3 className="mb-3">Financial Overview</h3>
				<Container>
					<div className="row justify-content-center">
						<div className="col-md-5 mb-3">
							<Card className='bg-primary text-white p-3 text-center'>
								<h5>Total Income</h5>
								<h2>&#8377;{totalIncome.toFixed(2)}</h2>
							</Card>
						</div>
						<div className="col-md-5 mb-3">
							<Card className='bg-danger text-white p-3 text-center'>
								<h5>Total Expense</h5>
								<h2>&#8377;{totalExpense.toFixed(2)}</h2>
							</Card>
						</div>
					</div>
					<Card className='container mt-3 p-3'>
						<h5 className="text-center">Income Used By Expenses</h5>
						<ProgressBar now={progressNow} label={`${progressNow.toFixed(1)}%`} />
						<p className="text-center mt-2">Net Balance: &#8377;{(totalIncome - totalExpense).toFixed(2)}</p>
					</Card>
				</Container>
			</div>

			<AddTransactionModal
				show={showAddTransactionModal}
				handleClose={handleCloseAddTransactionModal}
				onTransactionAdded={handleTransactionAdded}
			/>
		</Container>
	);
};

export default Income;