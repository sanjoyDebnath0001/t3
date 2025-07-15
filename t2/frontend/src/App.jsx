import React, { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router,Route,Routes} from 'react-router-dom';
import Register from './components/Register.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AccountantDashboard from './components/AccountantDashboard.jsx';
import BudgetManager from './components/BudgetManager.jsx';
import Transaction from './components/Transaction.jsx';
import ReportsPage from './components/ReportsPage.jsx';
import ReportGenerator from './components/ReportGenerator.jsx';
import Layout from './components/Layout.jsx';
import Dreports from './components/DevoloperReport.jsx';
import axiosInstance from './setting/axiosInstance.js';
import bgpic from './components/assets/bgpic.jpg';
import Model from './components/Modal.jsx';

import ProfileSettings from './components/ProfileSettings.jsx';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';




function App() {
  
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgotpassword" element={<ForgotPassword/>}/>
          <Route path="/resetpassword/:resettoken" element={<ResetPassword/>} />
          <Route element={<Layout/>}>
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/budgets" element={<BudgetManager/>}/>
            <Route path="/transaction" element={<Transaction/>}/>
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports" element={<ReportGenerator />} />
              <Route path="/dreports" element={<Dreports/>} />
            <Route path="/settings/profile" element={<ProfileSettings/>}/> 
            {/* More protected regular user routes here */}
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            {/* More protected admin-only routes here */}
          </Route>

          {/* Protected Accountant/Manager Routes */}
          <Route element={<PrivateRoute allowedRoles={['accountant', 'manager', 'admin']} />}>
            <Route path="/accounting-dashboard" element={<AccountantDashboard />} />
            {/* More protected accounting/manager routes here */}
          </Route>
        </Route>
          <Route path="/" element={<Login />} /> 
        </Routes>
      </div>
    </Router>
  )
}

export default App;
