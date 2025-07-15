// frontend/src/components/BudgetManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Form, Alert, Row, Col, ListGroup } from 'react-bootstrap';
import { FaEdit, FaTrashAlt, FaPlusCircle } from 'react-icons/fa'; // For icons (npm install react-icons)
import axiosInstance from '../setting/axiosInstance';

const BudgetManager = () => {
    const [budgets, setBudgets] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        period: 'monthly',
        startDate: '',
        endDate: '',
        categories: [{ name: '', allocatedAmount: 0, type: 'expense' }],
        description: ''
    });
    const [editMode, setEditMode] = useState(false);
    const [currentBudgetId, setCurrentBudgetId] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { name, period, startDate, endDate, categories, description } = formData;

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        setError('');
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { 'x-auth-token': token }
            };
            const res = await axiosInstance.get('/budgets', config);
            setBudgets(res.data);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to fetch budgets.');
            console.error(err);
        }
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onCategoryChange = (index, e) => {
        const newCategories = [...categories];
        newCategories[index][e.target.name] = e.target.value;
        setFormData({ ...formData, categories: newCategories });
    };

    const addCategoryField = () => {
        setFormData({
            ...formData,
            categories: [...categories, { name: '', allocatedAmount: 0, type: 'expense' }]
        });
    };

    const removeCategoryField = (index) => {
        const newCategories = categories.filter((_, i) => i !== index);
        setFormData({ ...formData, categories: newCategories });
    };

    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            };

            if (editMode) {
                await axiosInstance.put(`/budgets/${currentBudgetId}`, formData, config);
                setMessage('Budget updated successfully!');
            } else {
                await axiosInstance.post('/budgets', formData, config);
                setMessage('Budget created successfully!');
            }
            resetForm();
            fetchBudgets(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.msg || 'Error saving budget.');
            console.error(err);
        }
    };

    const onEdit = (budget) => {
        setFormData({
            name: budget.name,
            period: budget.period,
            startDate: budget.startDate.split('T')[0], // Format date for input
            endDate: budget.endDate.split('T')[0],   // Format date for input
            categories: budget.categories,
            description: budget.description
        });
        setEditMode(true);
        setCurrentBudgetId(budget._id);
        setMessage('');
        setError('');
    };

    const onDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this budget?')) {
            setError('');
            setMessage('');
            try {
                const token = localStorage.getItem('token');
                const config = {
                    headers: { 'x-auth-token': token }
                };
                await axios.delete(`/api/budgets/${id}`, config);
                setMessage('Budget deleted successfully!');
                fetchBudgets();
            } catch (err) {
                setError(err.response?.data?.msg || 'Failed to delete budget.');
                console.error(err);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            period: 'monthly',
            startDate: '',
            endDate: '',
            categories: [{ name: '', allocatedAmount: 0, type: 'expense' }],
            description: ''
        });
        setEditMode(false);
        setCurrentBudgetId(null);
    };

    return (
        <Container className="mt-5">
            <Card className="mb-4">
                <Card.Body>
                    <h2 className="text-center mb-4">{editMode ? 'Edit Budget' : 'Create New Budget'}</h2>
                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={onSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="budgetName">
                                    <Form.Label>Budget Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., Monthly Household Budget"
                                        name="name"
                                        value={name}
                                        onChange={onChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="budgetPeriod">
                                    <Form.Label>Period</Form.Label>
                                    <Form.Select name="period" value={period} onChange={onChange} required>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="annually">Annually</option>
                                        <option value="custom">Custom</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="budgetStartDate">
                                    <Form.Label>Start Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="startDate"
                                        value={startDate}
                                        onChange={onChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="budgetEndDate">
                                    <Form.Label>End Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        value={endDate}
                                        onChange={onChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h4 className="mt-4 mb-3">Categories</h4>
                        {categories.map((cat, index) => (
                            <Row key={index} className="mb-2 align-items-end">
                                <Col md={4}>
                                    <Form.Group controlId={`categoryName-${index}`}>
                                        <Form.Label>Category Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="e.g., Groceries, Salary"
                                            name="name"
                                            value={cat.name}
                                            onChange={e => onCategoryChange(index, e)}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group controlId={`categoryAmount-${index}`}>
                                        <Form.Label>Amount</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="0"
                                            name="allocatedAmount"
                                            value={cat.allocatedAmount}
                                            onChange={e => onCategoryChange(index, e)}
                                            min="0"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group controlId={`categoryType-${index}`}>
                                        <Form.Label>Type</Form.Label>
                                        <Form.Select name="type" value={cat.type} onChange={e => onCategoryChange(index, e)} required>
                                            <option value="expense">Expense</option>
                                            <option value="income">Income</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={2} className="d-flex align-items-end">
                                    {categories.length > 1 && (
                                        <Button variant="danger" onClick={() => removeCategoryField(index)} className="w-100">
                                            <FaTrashAlt />
                                        </Button>
                                    )}
                                </Col>
                            </Row>
                        ))}
                        <Button variant="outline-primary" onClick={addCategoryField} className="mt-2 mb-4">
                            <FaPlusCircle className="me-2" /> Add Category
                        </Button>

                        <Form.Group className="mb-3" controlId="budgetDescription">
                            <Form.Label>Description (Optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="A brief description of this budget"
                                name="description"
                                value={description}
                                onChange={onChange}
                            />
                        </Form.Group>

                        <div className="d-grid gap-2">
                            <Button variant="success" type="submit">
                                {editMode ? 'Update Budget' : 'Create Budget'}
                            </Button>
                            {editMode && (
                                <Button variant="secondary" onClick={resetForm}>
                                    Cancel Edit
                                </Button>
                            )}
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            <h2 className="mt-5 mb-4 text-center">My Budgets</h2>
            {budgets.length === 0 ? (
                <Alert variant="info" className="text-center">No budgets found. Start by creating one!</Alert>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {budgets.map(budget => (
                        <Col key={budget._id}>
                            <Card>
                                <Card.Body>
                                    <Card.Title>{budget.name} ({budget.period})</Card.Title>
                                    <Card.Subtitle className="mb-2 text-muted">
                                        {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                                    </Card.Subtitle>
                                    <Card.Text>
                                        <strong>Total Allocated:</strong> ${budget.totalAllocatedAmount.toFixed(2)}
                                        {budget.description && <p className="mt-2">{budget.description}</p>}
                                    </Card.Text>
                                    <h6 className="mt-3">Categories:</h6>
                                    <ListGroup variant="flush">
                                        {budget.categories.map((cat, idx) => (
                                            <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                                                {cat.name}
                                                <span className={`badge ${cat.type === 'income' ? 'bg-success' : 'bg-danger'}`}>
                                                    {cat.type === 'income' ? '+' : '-'}${cat.allocatedAmount.toFixed(2)}
                                                </span>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                    <div className="d-flex justify-content-end mt-3">
                                        <Button variant="info" size="sm" className="me-2" onClick={() => onEdit(budget)}>
                                            <FaEdit /> Edit
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => onDelete(budget._id)}>
                                            <FaTrashAlt /> Delete
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default BudgetManager;