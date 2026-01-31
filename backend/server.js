const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for users (replace with DB in production)
let users = [];
const MAX_USERS = Infinity; // Unlimited users

// Helper function to validate Rwandan phone number
function isRwandanPhone(phone) {
  return phone.startsWith('+250') && phone.length === 13;
}

// Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to ALWIN!' });
});

app.post('/api/login', (req, res) => {
  const { username } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ message: 'Login successful', user: { id: user.id, username: user.username, paymentStatus: user.paymentStatus } });
});

app.post('/api/register', (req, res) => {
  const { email, phone, username } = req.body;

  // Validation
  if (!email || !phone || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!isRwandanPhone(phone)) {
    return res.status(400).json({ error: 'Phone number must be a valid Rwandan number (+250...)' });
  }

  // Check if user already exists
  const existingUser = users.find(u => u.email === email || u.phone === phone || u.username === username);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Create user
  const newUser = {
    id: users.length + 1,
    email,
    phone,
    username,
    earnings: 0,
    paymentStatus: false,
    registeredAt: new Date()
  };
  users.push(newUser);

  res.status(201).json({ message: 'Registration successful. Please complete payment to activate.', user: { id: newUser.id, username: newUser.username, paymentStatus: newUser.paymentStatus } });
});

app.get('/api/users', (req, res) => {
  res.json(users.map(u => ({ id: u.id, username: u.username, earnings: u.earnings })));
});

// Endpoint for registered users to get content
app.get('/api/content/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.paymentStatus) {
    return res.status(403).json({ error: 'Payment required to access content' });
  }

  // Simulate content
  const content = {
    videos: [
      { id: 1, title: 'How to Earn Money Online - Complete Guide', url: 'https://www.youtube.com/watch?v=9bZkp7q19f0' },
      { id: 2, title: 'Motivational Video for Entrepreneurs', url: 'https://www.youtube.com/watch?v=2Q8JXN8T1c' },
      { id: 3, title: 'Rwandan Business Success Stories', url: 'https://www.youtube.com/watch?v=h9L8Kj1Q3w' },
      { id: 4, title: 'Mobile Money Tips for Africa', url: 'https://www.youtube.com/watch?v=ZX8x9n8x8x8' }
    ],
    ads: [
      { id: 1, title: 'Join ALWIN Premium', content: 'Unlock exclusive earning opportunities! Sign up now and earn 50% more.' },
      { id: 2, title: 'Invest in Your Future', content: 'Start your online business today. Low investment, high returns. Contact us!' },
      { id: 3, title: 'ALWIN Special Offer', content: 'Get free training on digital marketing. Limited time offer!' },
      { id: 4, title: 'Business Growth Seminar', content: 'Attend our virtual seminar on scaling your business. Register now!' }
    ],
    earnings: user.earnings
  };
  res.json(content);
});

// Endpoint to confirm payment (simulate)
app.post('/api/pay/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.paymentStatus = true;
  // Simulate API payment integration
  console.log(`Payment of 1700 RWF received from ${user.username} to 0793758208`);
  res.json({ message: 'Payment confirmed. KWISHYURA notification sent!', user: { id: user.id, username: user.username, paymentStatus: user.paymentStatus } });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});