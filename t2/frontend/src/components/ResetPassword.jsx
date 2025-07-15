// frontend/src/components/ResetPassword.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';
import axiosInstance from '../setting/axiosInstance';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { resettoken } = useParams(); // Get the token from the URL
    const navigate = useNavigate();

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== password2) {
            setError('Passwords do not match');
            return;
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            const body = JSON.stringify({ password, password2 });
            const res = await axiosInstance.put(`/auth/resetpassword/${resettoken}`, body, config);
            setMessage(res.data.msg);
            setTimeout(() => {
                navigate('/login'); // Redirect to login after successful reset
            }, 3000); // Redirect after 3 seconds
        } catch (err) {
            setError(err.response?.data?.msg || err.response?.data?.errors?.[0]?.msg || 'Failed to reset password. Invalid or expired token.');
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '28rem' }}>
                <Card.Body>
                    <h1 className="text-center mb-4">Reset Password</h1>
                    <p className="lead text-center">Enter your new password.</p>
                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={onSubmit}>
                        <Form.Group className="mb-3" controlId="formNewPassword">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength="6"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formConfirmNewPassword">
                            <Form.Label>Confirm New Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Confirm new password"
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                                minLength="6"
                                required
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit" className="w-100">
                            Reset Password
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ResetPassword;