import React from "react";

const Dreports = () => {
	
	return (
		
		<div>
			<form>
			<fieldset>
			<legend>Report an issue</legend>
			
				<label>Your Name:</label>
				<input type="text" id="name" name="name" />
				<br></br>
				<label >Your Email:</label>
				<input type="email" id="email" name="email" />
				<br></br>
				<label for="issueType">Issue Type:</label>
				<select>
					<option value="">--Please choose an option--</option>
					<option value="bug">Bug</option>
					<option value="feature">Feature Request</option>
					<option value="performance">Performance</option>
					<option value="ui">User Interface</option>
				</select>
				<br></br>
				<label >Issue Description:</label>
				<br></br>
				<textarea id="description" name="description" rows="6"></textarea>
				<br></br>
				<button type="submit">Submit Issue</button>
				
				</fieldset>
			</form>
		</div>
	)
}
export default Dreports;