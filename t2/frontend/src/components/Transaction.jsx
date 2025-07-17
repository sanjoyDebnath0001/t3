// src/Component/Transaction.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Button, Alert, Row, Col, Card, ProgressBar, Spinner } from 'react-bootstrap';
import axiosInstance from '../setting/axiosInstance';
import AddTransactionModal from './AddTransactionModal';

const Transaction = ({ userId }) => { 
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [totalIncome, setTotalIncome] = useState(0);
	const [totalExpense, setTotalExpense] = useState(0);
	const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);

	const handleCloseAddTransactionModal = () => setShowAddTransactionModal(false);
	const handleShowAddTransactionModal = () => setShowAddTransactionModal(true);

	const fetchAllData = useCallback(async () => {
		const config = {
			headers: {
				'Content-Type': 'application/json',
			},
		};
		setLoading(true);
		setError(null);
		try {
			const transactionsRes = await axiosInstance.get('/transactions', {
				params: { userId }
			});

			const incomeTransactions = transactionsRes.data.filter(t => t.type === 'income');
			const expenseTransactions = transactionsRes.data.filter(t => t.type === 'expense');

			const calculatedTotalIncome = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
			const calculatedTotalExpense = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);

			setTransactions(transactionsRes.data);
			setTotalIncome(calculatedTotalIncome);
			setTotalExpense(calculatedTotalExpense);
		} catch (err) {
			console.error('Error fetching data:', err);
			setTransactions([]);
			setTotalIncome(0);
			setTotalExpense(0);
			setError(`Failed to fetch data: ${err.response?.data?.message || 'Please try again.'}`);
		} finally {
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		if (userId) {
			fetchAllData();
		}
	}, [userId, fetchAllData]);

	const calculateProgress = useCallback(() => {
		if (totalIncome <= 0) {
			return 100;
		}
		const percentage = (totalExpense / totalIncome) * 100;
		return Math.min(100, Math.max(0, percentage));
	}, [totalExpense, totalIncome]);

	const progressNow = calculateProgress();

	const handleTransactionAdded = () => {
		handleCloseAddTransactionModal();
		fetchAllData();
	};

	const handleViewTransaction = (id) => {
		alert(`View transaction with ID: ${id}`);
	};

	const handleEditTransaction = (id) => {
		alert(`Edit transaction with ID: ${id}`);
	};

	const handleDeleteTransaction = async (id) => {
		if (window.confirm('Are you sure you want to delete this transaction? This cannot be undone.')) {
			try {
				await axiosInstance.delete(`/transactions/${id}`);
				alert('Transaction deleted successfully!');
				fetchAllData();
			} catch (err) {
				console.error('Error deleting transaction:', err);
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
				<p>Loading transaction data...</p>
			</Container>
		);
	}

	return (
		<Container className="mt-5">
			<h2 className="mb-4">Your Transactions</h2>
			{error && <Alert variant="danger">{error}</Alert>}

			<div className="d-flex justify-content-end mb-3">
				<Button variant="success" onClick={handleShowAddTransactionModal}>
					Add New Transaction
				</Button>
			</div>

			{transactions.length === 0 ? (
				<Alert variant="info">No transactions found. Add one now!</Alert>
			) : (
				<Row>
					{transactions.map(transaction => (
						<Col key={transaction._id} md={6} lg={4} className="mb-4">
							<Card className="shadow-sm h-100">
								<Card.Body className="d-flex flex-column">
									<div className="d-flex justify-content-between align-items-center">
										<Card.Title className="mb-1">{transaction.category}</Card.Title>
										<span className={`badge ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}`}>
											{transaction.type}
										</span>
									</div>
									<Card.Subtitle className="mb-2 text-muted">
										{new Date(transaction.date).toLocaleDateString()}
									</Card.Subtitle>
									<Card.Text className="mb-2">
										<strong>Amount:</strong> {transaction.account?.currency || '₹'} {transaction.amount.toFixed(2)}
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
						</Col>
					))}
				</Row>
			)}

			<div className="mt-5">
				<h3 className="mb-3">Financial Overview</h3>
				<Container>
					<Row className="justify-content-center">
						<Col md={5} className="mb-3">
							<Card className='bg-success text-white p-3 text-center'>
								<h5>Total Income</h5>
								<h2>{`₹${totalIncome.toFixed(2)}`}</h2>
							</Card>
						</Col>
						<Col md={5} className="mb-3">
							<Card className='bg-danger text-white p-3 text-center'>
								<h5>Total Expense</h5>
								<h2>{`₹${totalExpense.toFixed(2)}`}</h2>
							</Card>
						</Col>
					</Row>
					<Card className='container mt-3 p-3'>
						<h5 className="text-center">Income Used By Expenses</h5>
						<ProgressBar now={progressNow} label={`${progressNow.toFixed(1)}%`} />
						<p className="text-center mt-2">Net Balance: {`₹${(totalIncome - totalExpense).toFixed(2)}`}</p>
					</Card>
				</Container>
			</div>

			<AddTransactionModal
				show={showAddTransactionModal}
				handleClose={handleCloseAddTransactionModal}
				onTransactionAdded={handleTransactionAdded}
                userId={userId} 
            />
		</Container>
	);
};

export default Transaction;