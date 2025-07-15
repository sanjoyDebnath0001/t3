// frontend/src/components/AccountantDashboard.jsx
import React from 'react';
import { Container, Card } from 'react-bootstrap';
import { GrDashboard } from 'react-icons/gr';
import { NavLink } from 'react-router-dom';

const AccountantDashboard = () => {
    return (
        <Container className="mt-5">
            <Card>
                <Card.Body>
                    <h1 className="text-center">Accounting & Management Dashboard</h1>
                    <p className="lead text-center">Welcome! Here you can manage financial records and reports.</p>
                    {/* Add accountant/manager-specific content here */}
                </Card.Body>
            </Card>
            <Card>
                <GrDashboard/>
            </Card>
        </Container>
    );
};

export default AccountantDashboard;