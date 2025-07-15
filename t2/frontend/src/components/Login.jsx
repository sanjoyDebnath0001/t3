// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap'; // Import Alert
import axiosInstance from '../setting/axiosInstance';
import bgpic from './assets/bgpic.jpg';
const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        twoFactorCode: '' // New state for 2FA code
    });

    const { email, password, twoFactorCode } = formData;
    const [twoFactorRequired, setTwoFactorRequired] = useState(false); // State to control 2FA input visibility
    const [error, setError] = useState(''); // State for displaying errors

    const navigate = useNavigate();

    const onChange = e =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError(''); // Clear previous errors

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const body = JSON.stringify({ email, password, twoFactorCode });
            const res = await axiosInstance.post('/auth/login', body, config);
            console.log(res.data);

            if (res.data.twoFactorRequired) {
                setTwoFactorRequired(true); // Backend needs 2FA, show input
                setMessage(res.data.msg); // Display message from backend
                return; // Stop here, wait for 2FA code
            }

            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            console.error(err.response?.data?.errors || err.response?.data?.msg || err.message);
            setError(err.response?.data?.msg || 'Login failed');
            // If the error indicates 2FA is required, but it wasn't caught above
            if (err.response?.data?.twoFactorRequired) {
                setTwoFactorRequired(true);
            }
        }
    };

    return (
        <div className='container-fluid  ' style={{ backgroundImage: `url(${bgpic})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', minHeight: '100vh', display: 'flex', overflow: 'hidden', alignItems: 'center' }}>
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card className='container-fluid center' style={{ width: '28rem' }}>
                <Card.Body>
                    <h1 className="text-center mb-4">Sign In</h1>
                    <p className="lead text-center"><i className="fas fa-user"></i> Sign Into Your Account</p>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={e => onSubmit(e)}>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Enter email"
                                name="email"
                                value={email}
                                onChange={e => onChange(e)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Password"
                                name="password"
                                value={password}
                                onChange={e => onChange(e)}
                                minLength="6"
                                required
                            />
                        </Form.Group>

                        {twoFactorRequired && (
                            <Form.Group className="mb-3" controlId="formTwoFactorCode">
                                <Form.Label>Two-Factor Code</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter 2FA code"
                                    name="twoFactorCode"
                                    value={twoFactorCode}
                                    onChange={e => onChange(e)}
                                    required
                                />
                                <Form.Text className="text-muted">
                                    Open your authenticator app (e.g., Google Authenticator) to get the code.
                                </Form.Text>
                            </Form.Group>
                        )}

                        <div className="d-flex justify-content-end mb-3">
                            <Link to="/forgotpassword">Forgot Password?</Link>
                        </div>

                        <Button variant="primary" type="submit" className="w-100">
                            Login
                        </Button>
                    </Form>
                    <p className="mt-3 text-center">
                        Don't have an account? <Link to="/register">Sign Up</Link>
                    </p>
                </Card.Body>
            </Card>
        </Container>
        </div>
    );
};

export default Login;