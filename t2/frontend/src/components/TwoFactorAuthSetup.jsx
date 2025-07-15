// frontend/src/components/TwoFactorAuthSetup.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Form, Alert, Image } from 'react-bootstrap';
import axiosInstance from '../setting/axiosInstance';

const TwoFactorAuthSetup = () => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [is2faEnabled, setIs2faEnabled] = useState(false); // To check initial 2FA status

    useEffect(() => {
        const check2FAStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                // Not logged in, handle redirect or message
                return;
            }
            try {
                // Make a protected API call to get user info, which might include 2FA status
                // For now, let's assume we can get it from decoding the current token's payload
                // In a real app, you'd have a /api/users/me endpoint
                const decodedToken = JSON.parse(atob(token.split('.')[1])); // Simple decode (no validation)
                if (decodedToken.user && decodedToken.user.isTwoFactorEnabled !== undefined) {
                    setIs2faEnabled(decodedToken.user.isTwoFactorEnabled);
                } else {
                    // Fallback: make an actual API call to get user status
                    // This requires a new backend route, e.g., /api/auth/me
                    // For now, we'll assume the initial login response gave us this
                    // If your login response doesn't give isTwoFactorEnabled, you'd need an extra fetch here
                }
            } catch (err) {
                console.error("Error decoding token or checking 2FA status:", err);
                localStorage.removeItem('token'); // Invalid token
            }
        };
        check2FAStatus();
    }, []);

    const generateSecret = async () => {
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
            const res = await axiosInstance.post('/auth/2fa/generate-secret', {}, config);
            setQrCodeUrl(res.data.qrCodeUrl);
            setSecretKey(res.data.secret);
            setMessage('Scan the QR code or enter the secret key into your authenticator app.');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to generate 2FA secret.');
            console.error(err);
        }
    };

    const verifySetup = async (e) => {
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
            const res = await axiosInstance.post('/auth/2fa/verify-setup', { token: code }, config);
            setMessage(res.data.msg);
            setIs2faEnabled(true);
            setQrCodeUrl(''); // Clear QR code after successful setup
            setSecretKey(''); // Clear secret key
            setCode(''); // Clear code input
            // Refresh token on client side if backend issues a new one, or re-login if needed
            // For simplicity, we just update status here. In a real app, you might want to refresh the token.
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid 2FA code. Please try again.');
            console.error(err);
        }
    };

    const disable2FA = async () => {
        setMessage('');
        setError('');
        const confirmDisable = window.confirm("Are you sure you want to disable 2FA? You will need to re-enable it if you change your mind.");
        if (!confirmDisable) return;

        const passwordInput = prompt("Please enter your current password to confirm disabling 2FA:");
        if (!passwordInput) {
            setError("Password is required to disable 2FA.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            };
            const res = await axiosInstance.post('/auth/2fa/disable', { password: passwordInput }, config);
            setMessage(res.data.msg);
            setIs2faEnabled(false);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to disable 2FA.');
            console.error(err);
        }
    };


    return (
        <Container className="mt-5">
            <Card>
                <Card.Body>
                    <h2 className="text-center mb-4">Two-Factor Authentication (2FA)</h2>
                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    {is2faEnabled ? (
                        <div>
                            <p className="lead text-center text-success">2FA is currently <strong className="text-decoration-underline">ENABLED</strong> for your account.</p>
                            <Button variant="danger" onClick={disable2FA}>Disable 2FA</Button>
                        </div>
                    ) : (
                        <div>
                            <p className="lead text-center">Enhance your account security with 2FA.</p>
                            {!qrCodeUrl && (
                                <Button variant="primary" onClick={generateSecret}>Enable 2FA</Button>
                            )}

                            {qrCodeUrl && (
                                <div className="mt-4 text-center">
                                    <h5>Scan with your Authenticator App:</h5>
                                    <Image src={qrCodeUrl} alt="2FA QR Code" fluid className="mb-3" style={{ maxWidth: '200px' }} />
                                    <p>Or manually enter this key:</p>
                                    <p className="fw-bold fs-5 text-break">{secretKey}</p>
                                    <Form onSubmit={verifySetup} className="mt-3">
                                        <Form.Group className="mb-3" controlId="form2FACode">
                                            <Form.Label>Verify Code</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter 6-digit code from app"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                                maxLength="6"
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Enter the 6-digit code displayed in your authenticator app to complete setup.
                                            </Form.Text>
                                        </Form.Group>
                                        <Button variant="success" type="submit">Verify & Enable 2FA</Button>
                                    </Form>
                                </div>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default TwoFactorAuthSetup;