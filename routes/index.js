const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Registration Endpoint
router.post('/register', async (req, res) => {
	const { email, username, password, passwordConf } = req.body;

	if (!email || !username || !password || !passwordConf) {
		return res.status(400).json({ error: "All fields are required." });
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return res.status(400).json({ error: "Invalid email format." });
	}
	if (username.length < 3) {
		return res.status(400).json({ error: "Username must be at least 3 characters." });
	}
	if (password.length < 8) {
		return res.status(400).json({ error: "Password must be at least 8 characters." });
	}
	if (password !== passwordConf) {
		return res.status(400).json({ error: "Passwords do not match." });
	}

	try {
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ error: "Email is already in use." });
		}

		const lastUser = await User.findOne().sort({ _id: -1 });
		const uniqueId = lastUser ? lastUser.unique_id + 1 : 1;

		const newUser = new User({
			unique_id: uniqueId,
			email,
			username,
			password,
			passwordConf
		});

		await newUser.save();
		res.status(201).json({ success: "You are registered, you can now login." });
	} catch (error) {
		res.status(500).json({ error: "Server error during registration." });
	}
});

// Login Endpoint
router.post('/login', async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: "All fields are required." });
	}

	try {
		const user = await User.findOne({ email });
		if (!user || user.password !== password) {
			return res.status(400).json({ error: "Incorrect email or password." });
		}

		req.session.userId = user.unique_id;

    // Send user ID along with success message
    res.json({ success: "Login successful!", userId: user.unique_id });
	} catch (error) {
		res.status(500).json({ error: "Server error during login." });
	}
});

router.get('/profile', async (req, res) => {
	try {
	  const userId = req.headers.userid; // Retrieve userId from request headers
	  if (!userId) {
		return res.status(401).json({ error: "Unauthorized access." });
	  }
  
	  const user = await User.findOne({ unique_id: userId });
	  if (!user) {
		return res.status(401).json({ error: "User not found." });
	  }
  
	  res.json({ username: user.username, email: user.email });
	} catch (error) {
	  res.status(500).json({ error: "Server error fetching profile." });
	}
  });
  
  router.post('/logout', (req, res) => {
	if (req.session) {
	  req.session.destroy(err => {
		if (err) return res.status(500).json({ error: "Logout failed." });
		res.json({ success: "Logout successful." });
	  });
	} else {
	  res.status(200).json({ success: "No active session." });
	}
  });
  

// Password Reset Endpoints
router.post('/forgetpass', async (req, res) => {
	const { email, password, passwordConf } = req.body;

	if (!email || !password || !passwordConf) {
		return res.status(400).json({ error: "All fields are required." });
	}
	if (password !== passwordConf) {
		return res.status(400).json({ error: "Passwords do not match." });
	}

	try {
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ error: "This email is not registered." });
		}

		user.password = password;
		user.passwordConf = passwordConf;
		await user.save();

		res.json({ success: "Password has been reset." });
	} catch (error) {
		res.status(500).json({ error: "Server error during password reset." });
	}
});

module.exports = router;
