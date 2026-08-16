import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Branches from './pages/Branches';
import Products from './pages/Products';
import Phones from './pages/Phones';

// ============================================
// ELECTRONICS & ACCESSORIES
// ============================================
import Electronics from './pages/Electronics';
import Accessories from './pages/Accessories';

// ============================================
// ACCESSORIES - Sub Pages
// ============================================
import RestockAccessory from './pages/accessories/RestockAccessory';

// ============================================
// PHONES - Sub Pages
// ============================================
import IMEIList from './pages/phones/IMEIList';
import SellPhone from './pages/phones/sellPhone';
import ReversePhone from './pages/phones/reversePhone';
import TransferPhone from './pages/phones/transferPhone';
import IMEIEdit from './pages/phones/IMEIEdit';
import PhoneReceipt from './pages/phones/PhoneReceipt';

// ============================================
// ELECTRONICS - Sub Pages
// ============================================
import SerialList from './pages/electronics/SerialList';
import SellElectronic from './pages/electronics/SellElectronic';
import ReverseElectronic from './pages/electronics/ReverseElectronic';
import TransferElectronic from './pages/electronics/TransferElectronic';
import ElectronicReceipt from './pages/electronics/ElectronicReceipt';

// ============================================
// SALES & REPORTS
// ============================================
import Sales from './pages/Sales';
import SalesReceipt from './pages/sales/Receipt';

// ============================================
// REPORTS & REVENUES - ✅ NEW
// ============================================
import Reports from './pages/Reports';
import Revenues from './pages/Revenues';

// ============================================
// USERS & ROLES
// ============================================
import Users from './pages/Users';
import Roles from './pages/Roles';

// ============================================
// RECEIPTS & PROFILE
// ============================================
import Receipt from './pages/Receipt';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// ============================================
// SUPPORT PAGE
// ============================================
import Support from './pages/Support';

// ============================================
// POWERED BY PAGE
// ============================================
import PoweredBy from './pages/PoweredBy';

// ============================================
// AUTH & CONTEXT
// ============================================
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// ============================================
// PRIVATE ROUTE COMPONENT
// ============================================
const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#6c757d'
            }}>
                Loading TRONIC_MASTER...
            </div>
        );
    }
    
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ============================================
// APP COMPONENT
// ============================================
function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* ============================================ */}
                    {/* PUBLIC ROUTES */}
                    {/* ============================================ */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* POS & BRANCHES */}
                    {/* ============================================ */}
                    <Route path="/pos" element={
                        <PrivateRoute>
                            <POS />
                        </PrivateRoute>
                    } />
                    <Route path="/branches" element={
                        <PrivateRoute>
                            <Branches />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* PRODUCTS - MAIN */}
                    {/* ============================================ */}
                    <Route path="/products" element={
                        <PrivateRoute>
                            <Products />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* PRODUCTS - ELECTRONICS */}
                    {/* ============================================ */}
                    <Route path="/products/electronics" element={
                        <PrivateRoute>
                            <Electronics />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* PRODUCTS - ACCESSORIES */}
                    {/* ============================================ */}
                    <Route path="/products/accessories" element={
                        <PrivateRoute>
                            <Accessories />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* ACCESSORIES - RESTOCK */}
                    {/* ============================================ */}
                    <Route path="/accessories/restock/:id" element={
                        <PrivateRoute>
                            <RestockAccessory />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* PHONES */}
                    {/* ============================================ */}
                    <Route path="/phones" element={
                        <PrivateRoute>
                            <Phones />
                        </PrivateRoute>
                    } />
                    <Route path="/phones/imeis/:id" element={
                        <PrivateRoute>
                            <IMEIList />
                        </PrivateRoute>
                    } />
                    <Route path="/phones/sell/:id" element={
                        <PrivateRoute>
                            <SellPhone />
                        </PrivateRoute>
                    } />
                    <Route path="/phones/reverse/:id" element={
                        <PrivateRoute>
                            <ReversePhone />
                        </PrivateRoute>
                    } />
                    <Route path="/phones/transfer/:id" element={
                        <PrivateRoute>
                            <TransferPhone />
                        </PrivateRoute>
                    } />
                    <Route path="/phones/edit-imei/:id" element={
                        <PrivateRoute>
                            <IMEIEdit />
                        </PrivateRoute>
                    } />
                    <Route path="/phones/receipt/:id" element={
                        <PrivateRoute>
                            <PhoneReceipt />
                        </PrivateRoute>
                    } />

                    {/* ============================================ */}
                    {/* ELECTRONICS - Sub Pages */}
                    {/* ============================================ */}
                    <Route path="/products/electronics/serials/:id" element={
                        <PrivateRoute>
                            <SerialList />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/products/electronics/sell/:id" element={
                        <PrivateRoute>
                            <SellElectronic />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/products/electronics/reverse/:id" element={
                        <PrivateRoute>
                            <ReverseElectronic />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/products/electronics/transfer/:id" element={
                        <PrivateRoute>
                            <TransferElectronic />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/products/electronics/receipt/:id" element={
                        <PrivateRoute>
                            <ElectronicReceipt />
                        </PrivateRoute>
                    } />

                    {/* ============================================ */}
                    {/* SALES */}
                    {/* ============================================ */}
                    <Route path="/sales" element={
                        <PrivateRoute>
                            <Sales />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/sales/receipt" element={
                        <PrivateRoute>
                            <SalesReceipt />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* REPORTS - ✅ NEW */}
                    {/* ============================================ */}
                    <Route path="/reports" element={
                        <PrivateRoute>
                            <Reports />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* REVENUES - ✅ NEW */}
                    {/* ============================================ */}
                    <Route path="/revenues" element={
                        <PrivateRoute>
                            <Revenues />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* USERS & ROLES */}
                    {/* ============================================ */}
                    <Route path="/users" element={
                        <PrivateRoute>
                            <Users />
                        </PrivateRoute>
                    } />
                    <Route path="/roles" element={
                        <PrivateRoute>
                            <Roles />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* RECEIPT */}
                    {/* ============================================ */}
                    <Route path="/receipt" element={
                        <PrivateRoute>
                            <Receipt />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* PROFILE & SETTINGS */}
                    {/* ============================================ */}
                    <Route path="/profile" element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    } />
                    <Route path="/settings" element={
                        <PrivateRoute>
                            <Settings />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* SUPPORT */}
                    {/* ============================================ */}
                    <Route path="/support" element={
                        <PrivateRoute>
                            <Support />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* POWERED BY */}
                    {/* ============================================ */}
                    <Route path="/powered-by" element={
                        <PrivateRoute>
                            <PoweredBy />
                        </PrivateRoute>
                    } />
                    
                    {/* ============================================ */}
                    {/* CATCH ALL - Redirect to Dashboard */}
                    {/* ============================================ */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;