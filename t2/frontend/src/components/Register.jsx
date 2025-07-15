import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Card } from 'react-bootstrap';
import axiosInstance from '../setting/axiosInstance';
import bgpic from './assets/bgpic.jpg';
const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        password2: '',
        role: '',
        orgCode: ''
    });

    const { email, password, password2, role, orgCode } = formData;

    const navigate = useNavigate();

    const onChange = e =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        if (password !== password2) {
            console.error('Passwords do not match');
            alert('Passwords do not match'); // Simple alert for now
            return;
        } else {
            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                
                const body = JSON.stringify(
                    ['admin', 'manager', 'accountant'].includes(role)
                        ? { email, password, role, orgCode }
                        : { email, password, role }
                );
                const res = await axiosInstance.post('/auth/register', body, config);
                console.log(res.data);
                localStorage.setItem('token', res.data.token);
                navigate('/dashboard');
                
            } catch (err) {
                console.error(err.response?.data?.errors || err.response?.data?.msg || err.message);
                alert(err.response?.data?.msg || 'Registration failed'); // Display error to user
            }
        }
        if (['admin', 'manager', 'accountant'].includes(role) && !orgCode) {
            alert('Organization Code is required for this role');
            return;
        }
    };
    return (
        <div style={{ backgroundImage: `url(${bgpic})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', minHeight: '100vh', display: 'flex', overflow: 'hidden', alignItems: 'center' }}>
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '28rem' }}>
                <Card.Body>
                    <h1 className="text-center mb-4">Sign Up</h1>
                    <p className="lead text-center"><i className="fas fa-user"></i> Create Your Account</p>
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
                        {['admin', 'manager', 'accountant'].includes(role) && (
                            <Form.Group className="mb-3" controlId="formOrgCode">
                                <Form.Label>Organization Code</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter organization code"
                                    name="orgCode"
                                    value={formData.orgCode || ''}
                                    onChange={e => setFormData({ ...formData, orgCode: e.target.value })}
                                />
                            </Form.Group>
                        )}
                        <Form.Group className="mb-3" controlId="formBasicrole">
                            <Form.Label>role</Form.Label>
                                <Form.Select aria-label='regular'
                                    placeholder='select a role. If for personal use select regular.'
                                    name='role'
                                    value={role}
                                    required
                                    onChange={e => onChange(e)}
                                >
                                    <option value="regular">regular</option>
                                    <option value="accountant">accountant</option>
                                    <option value="manager">manager</option>
                                    <option value="admin">admin</option>
                                </Form.Select>
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

                        <Form.Group className="mb-3" controlId="formBasicPassword2">
                            <Form.Label>Confirm Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Confirm Password"
                                name="password2"
                                value={password2}
                                onChange={e => onChange(e)}
                                minLength="6"
                                required
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100">
                            Register
                        </Button>
                    </Form>
                    <p className="mt-3 text-center">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </p>
                </Card.Body>
            </Card>
            </Container>
    </div>
    );
};

export default Register;