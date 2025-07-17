// frontend/src/components/Layout.jsx
import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Container, Button, Navbar, Nav } from 'react-bootstrap';
import { jwtDecode } from 'jwt-decode';
import FullLogo from './assets/FullLogo.jpg'

const Layout = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    let userRole = '';

    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            if (decodedToken.user && decodedToken.user.role) {
                userRole = decodedToken.user.role;
            }
        } catch (error) {
            console.error("Error decoding token in Layout:", error);
            localStorage.removeItem('token');
            navigate('/login');
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand as={Link} to="/dashboard">
                        <img src={FullLogo} className="photo" style={{ width: 50, height: 40, }} alt="Kubaro Logo" />
                        {' Kubaro'}
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link as={Link} to="/dashboard">Overview</Nav.Link>
                            <Nav.Link as={Link} to="/budgets">Budgets</Nav.Link>
                            <Nav.Link as={Link} to="/transaction">Transaction</Nav.Link>
                            <Nav.Link as={Link} to="/reports">Reports</Nav.Link>
                            <Nav.Link as={Link} to="/dreports">C Reports</Nav.Link>
                            <Nav.Link as={Link} to="/settings/profile">Settings</Nav.Link>
                            {(userRole === 'admin') && (
                                <Nav.Link as={Link} to="/admin-dashboard">Admin</Nav.Link>
                            )}
                            {(userRole === 'accountant' || userRole === 'manager' || userRole === 'admin') && (
                                <Nav.Link as={Link} to="/accounting-dashboard">Accounting</Nav.Link>
                            )}
                        </Nav>
                        <Nav>
                            <Button variant="outline-light " className='bg-danger' onClick={handleLogout}>Logout</Button>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Outlet />
        </>
    );
};

export default Layout;