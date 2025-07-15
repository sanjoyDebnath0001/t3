// frontend/src/components/ForgotPassword.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';
import axiosInstance from '../setting/axiosInstance';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            const body = JSON.stringify({ email });
            const res = await axiosInstance.post('/auth/forgotpassword', body, config);
            setMessage(res.data.msg); // Display success message from backend
        } catch (err) {
            setError(err.response?.data?.msg || 'Something went wrong. Please try again.');
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '28rem' }}>
                <Card.Body>
                    <h1 className="text-center mb-4">Forgot Password</h1>
                    <p className="lead text-center">Enter your email address to receive a password reset link.</p>
                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={onSubmit}>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Enter email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit" className="w-100">
                            Send Reset Link
                        </Button>
                    </Form>
                    <p className="mt-3 text-center">
                        Remember your password? <a href="/login">Sign In</a>
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ForgotPassword;