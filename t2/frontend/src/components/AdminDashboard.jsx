// frontend/src/components/AdminDashboard.jsx
import React from 'react';
import { Container, Card } from 'react-bootstrap';

const AdminDashboard = () => {
    return (
        <Container className="mt-5">
            <Card>
                <Card.Body>
                    <h1 className="text-center">Admin Dashboard</h1>
                    <p className="lead text-center">Welcome, Admin! This area is for administrative tasks.</p>
                    {/* Add admin-specific content here */}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AdminDashboard;