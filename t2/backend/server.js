const dotenv = require('dotenv');
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const transactionRoutes = require('./routes/transactionRouters');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userInformationRoutes = require('./routes/userInformationRoutes');
const accountRoutes = require('./routes/accountRoutes');

const authMiddleware = require('./middleware/auth');
const authorize = require('./middleware/authorize');
const cors = require('cors');

const app = express();


connectDB();

// Init Middleware
app.use(express.json({ extended: false })); 
app.use(cors()); // Enable CORS

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/budgets',budgetRoutes);
app.use('/api/transactions',transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/userinfo', userInformationRoutes);
app.use('/api/accounts', accountRoutes);

app.get('/api/protected',authMiddleware,(req,res)=>{
	res.json({msg:`Welcome,user${req.user.id}! this is protected route.your role is ${res.user.role}`})
});
app.get('/api/admin-only',authMiddleware,authorize('admin'),(req,res)=>{
	res.json({msg:`Wlcome,Admin ${req.user.id}!you have access to admin content.`});
});
app.get('/api/accountant-manager-only',authMiddleware,authorize('accountant','manager','admin'),(req,res)=>{
	res.json({msg:`Welcome,${req.user.role}! you have access to accounting/manager content.`});
});

app.get('/',(req,res)=>{
	res.send('API is running....');
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));