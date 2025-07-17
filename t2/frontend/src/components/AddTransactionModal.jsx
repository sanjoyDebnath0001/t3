import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import axiosInstance from '../setting/axiosInstance';

const AddTransactionModal = ({ show, handleClose, onTransactionAdded }) => {
	const [accounts, setAccounts] = useState([]);
	const [selectedAccount, setSelectedAccount] = useState('');
	const [type, setType] = useState('expense'); // Default to expense
	const [amount, setAmount] = useState('');
	const [category, setCategory] = useState('');
	const [description, setDescription] = useState('');
	const [date, setDate] = useState('');

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Memoize fetchAccounts to prevent unnecessary re-creations
	const fetchAccounts = useCallback(async () => {
		try {
			setError(null);
			setLoading(true);
			const res = await axiosInstance.get('/accounts');
			setAccounts(res.data);
			if (res.data.length > 0) {
				setSelectedAccount(res.data[0]._id); // Select the first account by default
			} else {
				setSelectedAccount(''); // Ensure it's empty if no accounts
			}
		} catch (err) {
			console.error('Error fetching accounts:', err);
			setError(err.response?.data?.message || 'Failed to load accounts. Please try again.');
		} finally {
			setLoading(false);
		}
	}, []); // No dependencies for useCallback, as it's meant to fetch all accounts

	useEffect(() => {
		if (show) {
			fetchAccounts(); // Fetch accounts only when the modal becomes visible
		}
	}, [show, fetchAccounts]); // Depend on 'show' and the memoized 'fetchAccounts'

	// Reset form fields when modal is opened or closed
	useEffect(() => {
		if (!show) { // When modal closes
			setAmount('');
			setCategory('');
			setDescription('');
			// setSelectedAccount(''); // Do not reset, let fetchAccounts handle initial selection when opening
			setType('expense'); // Reset type to default
			setError(null);
		} else { // When modal opens, set default date to today
			const today = new Date();
			const year = today.getFullYear();
			const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
			const day = String(today.getDate()).padStart(2, '0');
			setDate(`${year}-${month}-${day}`);
		}
	}, [show]); // Only depend on 'show'

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		if (!selectedAccount) {
			setError('Please select an account.');
			setLoading(false);
			return;
		}

		if (!type || !amount || !category || !date) {
			setError('Please fill in all required fields: Type, Amount, Category, and Date.');
			setLoading(false);
			return;
		}

		const parsedAmount = parseFloat(amount);
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			setError('Please enter a valid positive amount.');
			setLoading(false);
			return;
		}

		const transactionData = {
			account: selectedAccount,
			type,
			amount: parsedAmount,
			category: category.trim(), // Trim category to avoid issues with extra spaces
			description: description.trim(), // Trim description
			date // Send date in YYYY-MM-DD format; backend will parse
		};

		try {
			await axiosInstance.post('/transactions', transactionData);
			alert('Transaction added successfully!');
			handleClose(); // Close modal
			onTransactionAdded(); // Notify parent component to refresh data
		} catch (err) {
			console.error('Error adding transaction:', err.response ? err.response.data : err);
			setError(err.response?.data?.message || 'Failed to add transaction. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal show={show} onHide={handleClose} backdrop="static" keyboard={false}>
			<Modal.Header closeButton>
				<Modal.Title>Add New Transaction</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{error && <Alert variant="danger">{error}</Alert>}
				{loading && <div className="text-center"><Spinner animation="border" size="sm" /> Loading accounts...</div>}

				<Form onSubmit={handleSubmit}>
					<Form.Group className="mb-3">
						<Form.Label>Account</Form.Label>
						<Form.Control
							as="select"
							value={selectedAccount}
							onChange={(e) => setSelectedAccount(e.target.value)}
							disabled={loading || accounts.length === 0}
							required
						>
							{accounts.length === 0 ? (
								<option value="">No accounts available</option>
							) : (
								accounts.map(acc => (
									<option key={acc._id} value={acc._id}>
										{acc.name} ({acc.currency || 'INR'} { // Added currency fallback
											acc.currentBalance !== null && acc.currentBalance !== undefined
												? acc.currentBalance.toFixed(2)
												: '0.00' // Provide a default if currentBalance is null/undefined
										})
									</option>
								))
							)}
						</Form.Control>
						{accounts.length === 0 && !loading && (
							<Form.Text className="text-danger">
								Please add an account first in the Accounts page.
							</Form.Text>
						)}
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label>Type</Form.Label>
						<Form.Control
							as="select"
							value={type}
							onChange={(e) => setType(e.target.value)}
							required
						>
							<option value="expense">Expense</option>
							<option value="income">Income</option>
						</Form.Control>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label>Amount</Form.Label>
						<Form.Control
							type="number"
							step="0.01"
							placeholder="e.g., 50.00"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							required
						/>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label>Category</Form.Label>
						<Form.Control
							type="text"
							placeholder="e.g., Groceries, Salary, Rent"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							required
						/>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label>Date</Form.Label>
						<Form.Control
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							required
						/>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label>Description (Optional)</Form.Label>
						<Form.Control
							as="textarea"
							rows={3}
							placeholder="e.g., Monthly grocery shopping"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							maxLength={200}
						/>
					</Form.Group>

					<Button variant="primary" type="submit" disabled={loading || accounts.length === 0}>
						{loading ? <Spinner animation="border" size="sm" /> : 'Add Transaction'}
					</Button>
				</Form>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={handleClose}>
					Cancel
				</Button>
			</Modal.Footer>
		</Modal>
	);
};

export default AddTransactionModal;