// frontend/src/components/ProfileSettings.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Card, Row, Col, Image, Button, Form, Alert, Spinner, Modal } from 'react-bootstrap';
import TwoFactorAuthSetup from './TwoFactorAuthSetup.jsx';
import PortraitPlaceholder from './assets/Portrait_Placeholder.jpg';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../setting/axiosInstance.js';

// API Endpoints - It's good practice to centralize these.
const API_PROFILE = '/userinfo/';
const API_ACCOUNTS = '/accounts/'; // Plural for fetching all accounts or creating a new one
const API_SINGLE_ACCOUNT = (id) => `/accounts/${id}`; // Function for a specific account by ID

const ProfileSettings = () => {
    // --- State for Profile Management ---
    const [profileFormData, setProfileFormData] = useState({
        name: '',
        image: null, // This will hold the File object for upload
        bio: '',
        purpose: '',
    });
    const [originalProfileData, setOriginalProfileData] = useState(null); // To revert changes

    const [profileMessage, setProfileMessage] = useState('');
    const [profileError, setProfileError] = useState('');
    const [profileLoading, setProfileLoading] = useState(true); // For initial profile fetch
    const [isSavingProfile, setIsSavingProfile] = useState(false); // For profile update submission
    const [imagePreview, setImagePreview] = useState(PortraitPlaceholder);

    const [showProfileModal, setShowProfileModal] = useState(false);

    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Destructure profile form data for easier use in JSX
    const { name, bio, purpose } = profileFormData;

    // --- State for Account Management ---
    const [accountFormData, setAccountFormData] = useState({
        accountName: '',
        accountType: '',
        balance: '', // Keep as string for input, parse to float for API
    });
    const [originalAccountData, setOriginalAccountData] = useState(null); // To revert changes for account
    const [accountMessage, setAccountMessage] = useState('');
    const [accountError, setAccountError] = useState('');
    const [accountLoading, setAccountLoading] = useState(true); // For initial account fetch
    const [isSavingAccount, setIsSavingAccount] = useState(false); // For account update/create/delete submission
    const [currentAccountId, setCurrentAccountId] = useState(null); // ID of the account being edited/deleted

    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

    // Cleanup for image preview URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    /**
     * Fetches the user's profile data from the API.
     */
    const fetchProfile = useCallback(async () => {
        setProfileLoading(true);
        setProfileError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setProfileError('No authentication token found. Please log in.');
                setProfileLoading(false);
                navigate('/login');
                return;
            }

            const res = await axiosInstance.get(API_PROFILE);

            const fetchedData = {
                name: res.data.name || '',
                // If profilepic is a URL, it's fine. If it's just a filename, you might need a base URL.
                // For now, assuming res.data.profilepic is the full URL or relative path the Image component can handle.
                image: res.data.profilepic || null, // Store URL/path or null, not the File object
                bio: res.data.bio || '',
                purpose: res.data.purpose || '',
            };
            setProfileFormData(fetchedData);
            setOriginalProfileData(fetchedData);
            setImagePreview(res.data.profilepic || PortraitPlaceholder);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setProfileError(err.response?.data?.msg || 'Failed to fetch profile data.');
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setProfileLoading(false);
        }
    }, [navigate]);

    /**
     * Fetches the user's primary account data from the API.
     * Assumes the API returns an array and we take the first one for simplicity.
     */
    const fetchAccount = useCallback(async () => {
        setAccountLoading(true);
        setAccountError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setAccountError('No authentication token found. Please log in.');
                setAccountLoading(false);
                navigate('/login');
                return;
            }

            const res = await axiosInstance.get(API_ACCOUNTS);

            if (res.data && res.data.length > 0) {
                const firstAccount = res.data[0];
                const fetchedAccountData = {
                    accountName: firstAccount.name || '', // Assuming 'name' from API
                    accountType: firstAccount.type || '', // Assuming 'type' from API
                    balance: firstAccount.balance?.toString() || '', // Store as string for input
                };
                setAccountFormData(fetchedAccountData);
                setOriginalAccountData(fetchedAccountData);
                setCurrentAccountId(firstAccount._id);
            } else {
                setAccountMessage('No account found. You can create one below.');
                setAccountFormData({ accountName: '', accountType: '', balance: '' });
                setOriginalAccountData(null);
                setCurrentAccountId(null);
            }
        } catch (err) {
            console.error('Error fetching account:', err);
            setAccountError(err.response?.data?.msg || 'Failed to fetch account data.');
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setAccountLoading(false);
        }
    }, [navigate]);

    // Initial data fetch on component mount
    useEffect(() => {
        fetchProfile();
        fetchAccount();
    }, [fetchProfile, fetchAccount]); // Depend on the memoized functions

    // --- Profile Handlers ---
    const onProfileChange = e => {
        setProfileFormData({ ...profileFormData, [e.target.name]: e.target.value });
        setProfileMessage('');
        setProfileError('');
    };

    const handleImageChange = e => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
            const maxFileSize = 5 * 1024 * 1024; // 5MB

            if (!acceptedImageTypes.includes(file.type)) {
                setProfileError('Only JPG, PNG, and GIF image formats are allowed.');
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // Clear the file input
                }
                // Revert to original image or placeholder if validation fails
                setImagePreview(originalProfileData?.image || PortraitPlaceholder);
                setProfileFormData(prev => ({ ...prev, image: originalProfileData?.image || null }));
                return;
            }

            if (file.size > maxFileSize) {
                setProfileError('Image file size cannot exceed 5MB.');
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // Clear the file input
                }
                // Revert to original image or placeholder if validation fails
                setImagePreview(originalProfileData?.image || PortraitPlaceholder);
                setProfileFormData(prev => ({ ...prev, image: originalProfileData?.image || null }));
                return;
            }

            // Set the File object directly to formData.image for submission
            setProfileFormData({ ...profileFormData, image: file });
            setImagePreview(URL.createObjectURL(file)); // For immediate preview
            setProfileMessage('');
            setProfileError('');
        }
    };

    const onProfileSubmit = async e => {
        e.preventDefault();
        setIsSavingProfile(true);
        setProfileMessage('');
        setProfileError('');

        try {
            const data = new FormData();
            data.append('name', name);
            data.append('bio', bio);
            data.append('purpose', purpose);

            // Only append the image if it's a new file selected (i.e., not a string URL)
            if (profileFormData.image instanceof File) {
                data.append('profilepic', profileFormData.image);
            }

            const res = await axiosInstance.put(API_PROFILE, data, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for FormData
                },
            });

            const updatedData = {
                name: res.data.name,
                bio: res.data.bio,
                purpose: res.data.purpose,
                image: res.data.profilepic, // Assuming the API returns the new image URL/path
            };
            setProfileFormData(updatedData);
            setOriginalProfileData(updatedData);
            setImagePreview(res.data.profilepic || PortraitPlaceholder);
            setProfileMessage('Profile updated successfully!');
            setShowProfileModal(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            setProfileError(err.response?.data?.msg || 'Failed to update profile.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleCancelProfileEdit = () => {
        if (originalProfileData) {
            setProfileFormData(originalProfileData);
            setImagePreview(originalProfileData.image || PortraitPlaceholder);
        } else {
            setProfileFormData({ name: '', image: null, bio: '', purpose: '' });
            setImagePreview(PortraitPlaceholder);
        }
        setProfileError('');
        setProfileMessage('');
        setShowProfileModal(false);
    };

    // --- Account Handlers ---
    const onAccountChange = e => {
        setAccountFormData({ ...accountFormData, [e.target.name]: e.target.value });
        setAccountMessage('');
        setAccountError('');
    };

    const onAccountSubmit = async e => {
        e.preventDefault();
        setIsSavingAccount(true);
        setAccountMessage('');
        setAccountError('');

        try {
            const accountPayload = {
                name: accountFormData.accountName, // Ensure consistency with backend API fields
                type: accountFormData.accountType,  // Ensure consistency with backend API fields
                balance: parseFloat(accountFormData.balance), // Parse to number for API
            };

            let res;
            if (currentAccountId) {

                res = await axiosInstance.put(
                    API_SINGLE_ACCOUNT(currentAccountId),
                    accountPayload,
                );
                setAccountMessage('Account updated successfully!');
            } else {
                res = await axiosInstance.post(API_ACCOUNTS, accountPayload);
                setAccountMessage('Account created successfully!');
            }

            // Update account state with the response data
            const updatedAccount = {
                accountName: res.data.name,
                accountType: res.data.type,
                balance: res.data.balance?.toString(), // Store as string for input
            };
            setAccountFormData(updatedAccount);
            setOriginalAccountData(updatedAccount);
            setCurrentAccountId(res.data._id); // Set the ID for newly created account
            setShowAccountModal(false);
        } catch (err) {
            console.error('Error saving account:', err);
            setAccountError(err.response?.data?.msg || 'Failed to save account.');
        } finally {
            setIsSavingAccount(false);
        }
    };

    const handleDeleteAccountClick = () => {
        setShowConfirmDeleteModal(true);
    };

    const confirmDeleteAccount = async () => {
        setShowConfirmDeleteModal(false);
        setIsSavingAccount(true);
        setAccountMessage('');
        setAccountError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setAccountError('No authentication token found. Please log in.');
                navigate('/login');
                return;
            }

            if (!currentAccountId) {
                setAccountError('No account selected for deletion.');
                return;
            }

            // No need for explicit config headers if axiosInstance is already configured with interceptors
            await axiosInstance.delete(API_SINGLE_ACCOUNT(currentAccountId));

            setAccountMessage('Account deleted successfully!');
            // Corrected: changed setAccountData to setAccountFormData
            setAccountFormData({ accountName: '', accountType: '', balance: '' });
            setOriginalAccountData(null);
            setCurrentAccountId(null);
            setShowAccountModal(false);
        } catch (err) {
            console.error('Error deleting account:', err);
            setAccountError(err.response?.data?.msg || 'Failed to delete account.');
        } finally {
            setIsSavingAccount(false);
        }
    };

    const cancelDeleteAccount = () => {
        setShowConfirmDeleteModal(false);
    };

    const handleCancelAccountEdit = () => {
        if (originalAccountData) {
            setAccountFormData(originalAccountData);
        } else {
            setAccountFormData({ accountName: '', accountType: '', balance: '' });
        }
        setAccountError('');
        setAccountMessage('');
        setShowAccountModal(false);
    };

    // Render loading spinner while fetching initial profile or account data
    if (profileLoading || accountLoading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" role="status" className="mb-3">
                    <span className="visually-hidden">Loading profile and account data...</span>
                </Spinner>
                <p>Loading your profile and account data...</p>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <h1 className="text-center mb-4">Profile Settings</h1>

            {/* General success and error alerts */}
            {(profileMessage || accountMessage) && <Alert variant="success" className="mb-3">{profileMessage || accountMessage}</Alert>}
            {(profileError || accountError) && <Alert variant="danger" className="mb-3">{profileError || accountError}</Alert>}

            {/* Profile Information Card */}
            <Card className="mb-4 rounded-lg shadow-md">
                <Card.Body>
                    <h2 className="card-title text-2xl font-semibold mb-4">General Information</h2>
                    <Row className="align-items-center">
                        <Col xs={12} md={4} className="text-center mb-3 mb-md-0">
                            <Image
                                src={imagePreview} // Always use imagePreview for display
                                alt="Profile Portrait"
                                roundedCircle
                                className="photo w-50 h-40 object-cover border-4 border-blue-200 shadow-lg"
                            />
                        </Col>
                        <Col xs={12} md={8}>
                            <h5 className="text-xl font-medium text-gray-800">Name: {profileFormData.name}</h5>
                            <p className="text-gray-600"><strong>Bio:</strong> {profileFormData.bio || 'Not provided'}</p>
                            <p className="text-gray-600"><strong>Purpose:</strong> {profileFormData.purpose || 'Not provided'}</p>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowProfileModal(true);
                                    setProfileMessage(''); // Clear messages on opening modal
                                    setProfileError(''); // Clear errors on opening modal
                                }}
                                className="mt-3 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition duration-300"
                            >
                                Edit Profile
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Profile Edit Modal */}
            <Modal show={showProfileModal} onHide={handleCancelProfileEdit} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Profile Information</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={onProfileSubmit}>
                        <Row className="mb-3 align-items-center">
                            <Col xs={12} md={4} className="text-center">
                                <div
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => fileInputRef.current?.click()}
                                    aria-label="Click to change profile image"
                                    role="button"
                                >
                                    <Image
                                        src={imagePreview}
                                        alt="Profile Portrait"
                                        roundedCircle
                                        className="photo w-50 h-50 object-cover border-4 border-blue-200 shadow-lg"
                                    />
                                    <small className="text-muted d-block mt-2">Click image to change</small>
                                </div>
                                <Form.Control
                                    type="file"
                                    name="image"
                                    onChange={handleImageChange}
                                    disabled={isSavingProfile}
                                    ref={fileInputRef}
                                    accept="image/jpeg, image/png, image/gif"
                                    className="d-none" // Hide the default file input
                                />
                            </Col>
                            <Col xs={12} md={8}>
                                <Form.Group controlId="formName" className="mb-3">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter your name"
                                        name="name"
                                        value={name}
                                        onChange={onProfileChange}
                                        disabled={isSavingProfile}
                                        className="rounded-md"
                                    />
                                </Form.Group>
                                <Form.Group controlId="formBio" className="mb-3">
                                    <Form.Label>Bio</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Tell us about yourself"
                                        name="bio"
                                        value={bio}
                                        onChange={onProfileChange}
                                        disabled={isSavingProfile}
                                        className="rounded-md"
                                    />
                                </Form.Group>
                                <Form.Group controlId="formPurpose" className="mb-3">
                                    <Form.Label>Purpose</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Your purpose or role"
                                        name="purpose"
                                        value={purpose}
                                        onChange={onProfileChange}
                                        disabled={isSavingProfile}
                                        className="rounded-md"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end">
                            <Button
                                variant="secondary"
                                onClick={handleCancelProfileEdit}
                                className="me-2 px-4 py-2 rounded-lg"
                                disabled={isSavingProfile}
                            >
                                Cancel
                            </Button>
                            <Button variant="success" type="submit" disabled={isSavingProfile}
                                className="px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition duration-300"
                            >
                                {isSavingProfile ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Two-Factor Authentication Setup */}
            <TwoFactorAuthSetup />

            {/* Account Details Overview Card */}
            <Card className="mt-4 mb-4 rounded-lg shadow-md">
                <Card.Body>
                    <h2 className="card-title text-2xl font-semibold mb-4">Account Details</h2>
                    {currentAccountId ? (
                        <>
                            <h5 className="text-xl font-medium text-gray-800">Account Name: {accountFormData.accountName}</h5>
                            <p className="text-gray-600"><strong>Account Type:</strong> {accountFormData.accountType}</p>
                            <p className="text-gray-600"><strong>Balance:</strong> ${parseFloat(accountFormData.balance).toFixed(2)}</p>
                            <div className="d-flex justify-content-end mt-3">
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setShowAccountModal(true);
                                        setAccountMessage(''); // Clear messages on opening modal
                                        setAccountError(''); // Clear errors on opening modal
                                    }}
                                    className="me-2 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition duration-300"
                                    disabled={isSavingAccount}
                                >
                                    Edit Account
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={handleDeleteAccountClick}
                                    className="px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition duration-300"
                                    disabled={isSavingAccount}
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-600">No account found. Create one to manage your finances.</p>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowAccountModal(true);
                                    // Reset form for new account creation
                                    setAccountFormData({ accountName: '', accountType: '', balance: '' });
                                    setOriginalAccountData(null); // No original data for a new account
                                    setCurrentAccountId(null); // Ensure no ID is set for new account
                                    setAccountMessage('');
                                    setAccountError('');
                                }}
                                className="mt-3 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition duration-300"
                                disabled={isSavingAccount}
                            >
                                Create Account
                            </Button>
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Account Edit/Create Modal */}
            <Modal show={showAccountModal} onHide={handleCancelAccountEdit} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{currentAccountId ? 'Edit Account Details' : 'Create New Account'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={onAccountSubmit}>
                        <Form.Group controlId="formAccountName" className="mb-3">
                            <Form.Label>Account Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., My Savings Account"
                                name="accountName"
                                value={accountFormData.accountName}
                                onChange={onAccountChange}
                                disabled={isSavingAccount}
                                className="rounded-md"
                            />
                        </Form.Group>
                        <Form.Group controlId="formAccountType" className="mb-3">
                            <Form.Label>Account Type</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., Checking, Savings, Investment"
                                name="accountType"
                                value={accountFormData.accountType}
                                onChange={onAccountChange}
                                disabled={isSavingAccount}
                                className="rounded-md"
                            />
                        </Form.Group>
                        <Form.Group controlId="formAccountBalance" className="mb-3">
                            <Form.Label>Balance</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                name="balance"
                                value={accountFormData.balance}
                                onChange={onAccountChange}
                                disabled={isSavingAccount}
                                className="rounded-md"
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end mt-3">
                            <Button
                                variant="secondary"
                                onClick={handleCancelAccountEdit}
                                className="me-2 px-4 py-2 rounded-lg"
                                disabled={isSavingAccount}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="success"
                                type="submit"
                                disabled={isSavingAccount}
                                className="px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition duration-300"
                            >
                                {isSavingAccount ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        Saving...
                                    </>
                                ) : (
                                    currentAccountId ? 'Save Changes' : 'Create Account'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showConfirmDeleteModal} onHide={cancelDeleteAccount} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete this account? This action cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cancelDeleteAccount} className="px-4 py-2 rounded-lg">
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDeleteAccount} className="px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition duration-300">
                        Delete Account
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Preferences Card (Future Feature) */}
            <Card className="mt-4 rounded-lg shadow-md">
                <Card.Body>
                    <h2 className="card-title text-2xl font-semibold mb-4">Preferences</h2>
                    <p className="text-gray-600">Manage your application preferences (future feature).</p>
                    {/* Placeholder for future preferences settings */}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ProfileSettings;