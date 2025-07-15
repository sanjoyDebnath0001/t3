// frontend/src/components/ProfileSettings.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Card, Row, Col, Image, Button, Form, Alert, Spinner } from 'react-bootstrap';
import TwoFactorAuthSetup from './TwoFactorAuthSetup.jsx';
import PortraitPlaceholder from './assets/Portrait_Placeholder.jpg';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import axiosInstance from '../setting/axiosInstance.js';

// Define constants for API paths
// Note: We'll keep the base path without :id here, and append it dynamically
const API_BASE_PROFILE_PATH = '/userinfo'; // Changed from '/userinfo/:id'
const AUTH_TOKEN_KEY = 'x-auth-token';

const ProfileSettings = () => {
    // State for the data currently in the form (could be edited or original)
    const [formData, setFormData] = useState({
        name: '',
        image: null, // Stores the File object for new uploads, or null/URL for existing
        bio: '',
        purpose: '',
    });

    // State to hold the original profile data fetched from the server
    
    const [originalFormData, setOriginalFormData] = useState(null);

    const [editMode, setEditMode] = useState(false); // Controls whether the edit form is visible
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true); 
    const [isSaving, setIsSaving] = useState(false); 
    const [imagePreview, setImagePreview] = useState(PortraitPlaceholder); // Default to placeholder

    const { name, bio, purpose } = formData; // Destructure for easier access in JSX

    const navigate = useNavigate();
    const { id } = useParams(); // Extract the user ID from the URL parameters
    const fileInputRef = useRef(null); // Ref for the hidden file input

    // --- Fetch Profile Data ---
    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found. Please log in.');
                setLoading(false);
                navigate('/login');
                return;
            }

            if (!id) { // Added check for ID
                setError('User ID not found in URL.');
                setLoading(false);
                return;
            }

            const config = {
                headers: { [AUTH_TOKEN_KEY]: token }
            };

            // Construct the API path using the extracted ID
            const API_URL = `${API_BASE_PROFILE_PATH}/${id}`;
            const res = await axiosInstance.get(API_URL, config);

            // Set both formData and originalFormData with the fetched data
            const fetchedData = {
                name: res.data.name || '',
                image: res.data.image || URL, 
                bio: res.data.bio || '',
                purpose: res.data.purpose || '',
            };
            setFormData(fetchedData);
            setOriginalFormData(fetchedData); 

            // Set image preview based on fetched image or placeholder
            setImagePreview(res.data.image || PortraitPlaceholder);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(err.response?.data?.msg || 'Failed to fetch profile data.');
            setLoading(false);
            if (err.response?.status === 401) {
                navigate('/login');
            }
        }
    }, [navigate, id]); // Add 'id' to useCallback dependencies

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]); // Depend on fetchProfile memoized by useCallback

    // --- Form Field Change Handler ---
    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMessage('');
        setError('');
    };

    // --- Image File Change Handler ---
    const handleImageChange = e => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Basic image validation
            const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
            const maxFileSize = 5 * 1024 * 1024; // 5 MB

            if (!acceptedImageTypes.includes(file.type)) {
                setError('Only JPG, PNG, and GIF image formats are allowed.');
                if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
                setImagePreview(originalFormData?.image || PortraitPlaceholder); // Revert preview to original
                setFormData(prev => ({ ...prev, image: originalFormData?.image || null })); // Revert formData.image
                return;
            }

            if (file.size > maxFileSize) {
                setError('Image file size cannot exceed 5MB.');
                if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
                setImagePreview(originalFormData?.image || PortraitPlaceholder); // Revert preview to original
                setFormData(prev => ({ ...prev, image: originalFormData?.image || null })); // Revert formData.image
                return;
            }

            // If valid, set the new file and create a preview URL
            setFormData({ ...formData, image: file });
            setImagePreview(URL.createObjectURL(file));
            setMessage('');
            setError('');
        }
    };

    // --- Form Submission Handler ---
    const onSubmit = async e => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found. Please log in.');
                setIsSaving(false);
                navigate('/login');
                return;
            }

            if (!id) { // Added check for ID
                setError('User ID not found in URL. Cannot update profile.');
                setIsSaving(false);
                return;
            }

            const config = {
                headers: {
                    [AUTH_TOKEN_KEY]: token,
                    'Content-Type': 'multipart/form-data'
                }
            };

            const data = new FormData();
            data.append('name', name);
            data.append('bio', bio);
            data.append('purpose', purpose);
            if (formData.image instanceof File) { // Check if a new file was selected
                data.append('image', formData.image);
            }

            // Construct the API path using the extracted ID for PUT request
            const API_URL = `${API_BASE_PROFILE_PATH}/${id}`;
            const res = await axiosInstance.put(API_URL, data, config);

            // Update formData and originalFormData with the new server response
            const updatedData = {
                name: res.data.name,
                bio: res.data.bio,
                purpose: res.data.purpose,
                image: res.data.image // This will be the new image URL
            };
            setFormData(updatedData);
            setOriginalFormData(updatedData); // Update original data after successful save
            setImagePreview(res.data.image || PortraitPlaceholder);
            setMessage('Profile updated successfully!');
            setEditMode(false); // Exit edit mode
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.msg || 'Failed to update profile.');
        } finally {
            setIsSaving(false); // Always stop saving state
        }
    };

    // --- Cancel Edit Mode ---
    const handleCancelEdit = () => {
        setEditMode(false);
        // Revert form data and image preview to original fetched state
        if (originalFormData) {
            setFormData(originalFormData);
            setImagePreview(originalFormData.image || PortraitPlaceholder);
        } else {
            // Fallback if originalFormData somehow isn't set (shouldn't happen if fetchProfile works)
            setFormData({ name: '', image: null, bio: '', purpose: '' });
            setImagePreview(PortraitPlaceholder);
        }
        setError('');
        setMessage('');
    };

    // --- Render Logic ---
    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" role="status" className="mb-3">
                    <span className="visually-hidden">Loading profile...</span>
                </Spinner>
                <p>Loading your profile data...</p>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <h1 className="text-center mb-4">Profile Settings</h1>

            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* --- Display Section (Visible when NOT in edit mode) --- */}
            {!editMode && originalFormData && (
                <Card className="mb-4">
                    <Card.Body>
                        <h2 className="card-title">Your Profile Information</h2>
                        <Row className="align-items-center mb-3">
                            <Col xs={12} md={4} className="text-center mb-3 mb-md-0">
                                <Image
                                    src={imagePreview}
                                    alt="Profile Portrait"
                                    roundedCircle
                                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                />
                            </Col>
                            <Col xs={12} md={8}>
                                <p><strong>Name:</strong> {originalFormData.name }</p>
                                <p><strong>Bio:</strong> {originalFormData.bio }</p>
                                <p><strong>Purpose:</strong> {originalFormData.purpose }</p>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end">
                            <Button variant="primary" onClick={() => setEditMode(true)}>
                                Edit Profile
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            )}

            
            {editMode && (
                <Card className="mb-4 border-primary"> {/* Added border-primary for visual cue */}
                    <Card.Body>
                        <h2 className="card-title text-primary">Edit Your Profile</h2>
                        <Form onSubmit={onSubmit}>
                            <Row className="mb-3 align-items-center">
                                <Col xs={12} md={4} className="text-center">
                                    <div
                                        style={{ cursor: 'pointer' }} // Always show pointer when in edit mode
                                        onClick={() => fileInputRef.current?.click()}
                                        aria-label={"Click to change profile image"}
                                        role="button"
                                    >
                                        <Image
                                            src={imagePreview}
                                            alt="Profile Portrait"
                                            roundedCircle
                                            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                        />
                                        <small className="text-muted d-block mt-2">Click image to change</small>
                                    </div>
                                    <Form.Control
                                        type="file"
                                        id="imageUpload"
                                        name="image"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                        disabled={isSaving}
                                        ref={fileInputRef}
                                        accept="image/jpeg, image/png, image/gif"
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
                                            onChange={onChange}
                                            disabled={isSaving}
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
                                            onChange={onChange}
                                            disabled={isSaving}
                                        />
                                    </Form.Group>
                                    <Form.Group controlId="formPurpose" className="mb-3">
                                        <Form.Label>Purpose</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Your purpose or role"
                                            name="purpose"
                                            value={purpose}
                                            onChange={onChange}
                                            disabled={isSaving}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <div className="d-flex justify-content-end">
                                <Button
                                    variant="secondary"
                                    onClick={handleCancelEdit}
                                    className="me-2"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                                <Button variant="success" type="submit" disabled={isSaving}>
                                    {isSaving ? (
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
                    </Card.Body>
                </Card>
            )}

            <TwoFactorAuthSetup />

            <Card className="mt-4">
                <Card.Body>
                    <h2 className="card-title">Preferences</h2>
                    <p>Manage your application preferences (future feature).</p>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ProfileSettings;