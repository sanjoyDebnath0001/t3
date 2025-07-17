import React from 'react';
import {
	Container,
	Card,
	Form,
	Button
} from 'react-bootstrap';

const Dreports = () => {
	return (
		<Container className="my-5">
			<Card className="p-4 shadow-sm">
				<Card.Body>
					<h2 className="mb-4 text-center">Report an Issue</h2>
					<Form>
						<Form.Group className="mb-3" controlId="formName">
							<Form.Label>Your Name</Form.Label>
							<Form.Control type="text" placeholder="Enter your name" />
						</Form.Group>

						<Form.Group className="mb-3" controlId="formEmail">
							<Form.Label>Your Email</Form.Label>
							<Form.Control type="email" placeholder="Enter your email" />
						</Form.Group>

						<Form.Group className="mb-3" controlId="formIssueType">
							<Form.Label>Issue Type</Form.Label>
							<Form.Select>
								<option>--Please choose an option--</option>
								<option value="bug">Bug</option>
								<option value="feature">Feature Request</option>
								<option value="performance">Performance</option>
								<option value="ui">User Interface</option>
							</Form.Select>
						</Form.Group>

						<Form.Group className="mb-4" controlId="formDescription">
							<Form.Label>Issue Description</Form.Label>
							<Form.Control
								as="textarea"
								rows={6}
								placeholder="Describe your issue in detail"
							/>
						</Form.Group>

						<div className="d-grid gap-2">
							<Button variant="primary" type="submit">
								Submit Issue
							</Button>
						</div>
					</Form>
				</Card.Body>
			</Card>
		</Container>
	);
};

export default Dreports;