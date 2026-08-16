import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { saleService } from '../services/saleService';
import './POS.css';

const POS = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [imeiSearchTerm, setImeiSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [payment, setPayment] = useState({ method: 'cash', amount: 0 });
  const [discount, setDiscount] = useState({ type: 'percentage', value: 0 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [quantityInput, setQuantityInput] = useState(1);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [imeiSearchResults, setImeiSearchResults] = useState([]);
  const [showImeiResults, setShowImeiResults] = useState(false);
  const [modalImeiSearchTerm, setModalImeiSearchTerm] = useState('');
  const [modalImeiResults, setModalImeiResults] = useState([]);
  const [showModalImeiResults, setShowModalImeiResults] = useState(false);
  const [processingSale, setProcessingSale] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showMpesaPayment, setShowMpesaPayment] = useState(false);
  const [mpesaData, setMpesaData] = useState({
    phoneNumber: '',
    amount: 0,
    transactionId: '',
    status: 'pending',
    paymentMethod: 'stk'
  });
  const [mpesaProcessing, setMpesaProcessing] = useState(false);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [paymentCheckInterval, setPaymentCheckInterval] = useState(null);
  const [detectedPayment, setDetectedPayment] = useState(null);
  const [showPaymentDetected, setShowPaymentDetected] = useState(false);
  const [paymentSearchResults, setPaymentSearchResults] = useState([]);
  const [showPaymentSearchResults, setShowPaymentSearchResults] = useState(false);
  const [searchingPayment, setSearchingPayment] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const posContainerRef = useRef(null);

  const inputRef = useRef(null);
  const imeiInputRef = useRef(null);
  const modalImeiInputRef = useRef(null);
  const mpesaPhoneInputRef = useRef(null);
  const searchPaymentInputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  const userRole = user?.companyRole || 'company_staff';
  const isCashier = userRole === 'company_cashier';

  const getCurrencySymbol = () => {
    if (selectedBranch) {
      const branch = branches.find(b => b._id === selectedBranch);
      return branch?.currencySymbol || 'KSh';
    }
    return 'KSh';
  };

  const getProductImageUrl = (product) => {
    if (!product) return null;
    if (product.image) {
      if (product.image.startsWith('http://') || product.image.startsWith('https://')) {
        return product.image;
      }
      return `${API_URL}${product.image}`;
    }
    return null;
  };

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const productsRes = await productService.getProducts();
      console.log('All products fetched:', productsRes.data?.length || 0);
      
      setProducts(productsRes.data || []);
      
      let branchesData = [];
      
      if (isCashier) {
        console.log('💳 Cashier detected - fetching assigned branch only');
        
        if (user?.branch) {
          const branchId = user.branch._id || user.branch;
          const response = await fetch(`${API_URL}/branches/${branchId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success && data.data) {
            branchesData = [data.data];
            setSelectedBranch(data.data._id);
            console.log('🏪 Cashier branch loaded:', data.data.name);
          }
        } else {
          try {
            const branchService = await import('../services/branchService');
            const result = await branchService.branchService.getUserBranches();
            if (result.success && result.data?.length > 0) {
              branchesData = result.data;
              setSelectedBranch(result.data[0]._id);
            }
          } catch (error) {
            console.error('Error fetching cashier branch:', error);
          }
        }
      } else {
        const branchesRes = await fetch(`${API_URL}/branches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await branchesRes.json();
        if (data.success) {
          branchesData = data.data || [];
          if (branchesData.length > 0) {
            setSelectedBranch(branchesData[0]._id);
          }
        }
      }
      
      setBranches(branchesData);
      console.log('🏪 Branches loaded:', branchesData.length);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SEARCH FUNCTIONS
  // ============================================
  const searchImeiSerial = (searchValue) => {
    if (!searchValue || searchValue.length < 3) {
      setImeiSearchResults([]);
      setShowImeiResults(false);
      return;
    }

    const term = searchValue.toLowerCase().trim();
    const results = [];

    products.forEach(product => {
      if (product.status !== 'active') return;
      
      if (product.category !== 'Accessories') {
        const availableUnits = product.units?.filter(u => 
          u.status === 'available' && 
          u.identifier.toLowerCase().includes(term)
        ) || [];
        
        if (availableUnits.length > 0) {
          results.push({
            product: product,
            units: availableUnits
          });
        }
      }
    });

    setImeiSearchResults(results);
    setShowImeiResults(results.length > 0);
  };

  const searchModalImeiSerial = (searchValue) => {
    if (!searchValue || searchValue.length < 3 || !selectedProduct) {
      setModalImeiResults([]);
      setShowModalImeiResults(false);
      return;
    }

    const term = searchValue.toLowerCase().trim();
    const availableUnits = selectedProduct.units?.filter(u => 
      u.status === 'available' && 
      u.identifier.toLowerCase().includes(term)
    ) || [];

    setModalImeiResults(availableUnits);
    setShowModalImeiResults(availableUnits.length > 0);
  };

  // ============================================
  // EFFECTS WITH FIXED DEPENDENCIES
  // ============================================
  useEffect(() => {
    fetchData();
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && cart.length > 0 && !processingSale && !loading && !showSuccess) {
        const activeElement = document.activeElement;
        if (activeElement && 
            activeElement.tagName !== 'INPUT' && 
            activeElement.tagName !== 'SELECT' &&
            activeElement.tagName !== 'TEXTAREA') {
          processSale();
        }
      }
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === 'Enter' && showSuccess) {
        handleDismissSuccess();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, processingSale, loading, showSuccess]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        handleDismissSuccess();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (payment.method === 'mpesa' && cart.length > 0) {
      const { total } = calculateTotals();
      if (total > 0) {
        setMpesaData({
          ...mpesaData,
          amount: total,
          phoneNumber: customer.phone || ''
        });
        setShowMpesaPayment(true);
        setTimeout(() => {
          if (mpesaPhoneInputRef.current) {
            mpesaPhoneInputRef.current.focus();
          }
        }, 300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment.method, cart]);

  useEffect(() => {
    return () => {
      if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
      }
    };
  }, [paymentCheckInterval]);

  useEffect(() => {
    if (imeiSearchTerm.length >= 3) {
      searchImeiSerial(imeiSearchTerm);
    } else {
      setImeiSearchResults([]);
      setShowImeiResults(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imeiSearchTerm]);

  useEffect(() => {
    if (modalImeiSearchTerm.length >= 3 && selectedProduct) {
      searchModalImeiSerial(modalImeiSearchTerm);
    } else {
      setModalImeiResults([]);
      setShowModalImeiResults(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalImeiSearchTerm, selectedProduct]);

  // ============================================
  // FULLSCREEN
  // ============================================
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const element = posContainerRef.current;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // ============================================
  // CART FUNCTIONS
  // ============================================
  const handleImeiResultClick = (product, unit) => {
    const existingItem = cart.find(item => 
      item.productId === product._id && 
      item.unitIdentifiers?.includes(unit.identifier)
    );
    
    if (existingItem) {
      alert(`Unit ${unit.identifier} is already in the cart!`);
      return;
    }

    const existingProduct = cart.find(item => item.productId === product._id);
    const itemPrice = product.price?.sale || product.price || 0;
    
    if (existingProduct) {
      const updatedUnits = [...existingProduct.unitIdentifiers, unit.identifier];
      const updatedItem = {
        ...existingProduct,
        unitIdentifiers: updatedUnits,
        quantity: updatedUnits.length,
        total: updatedUnits.length * existingProduct.price
      };
      setCart(cart.map(item => 
        item.productId === product._id ? updatedItem : item
      ));
    } else {
      setCart([...cart, {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        price: itemPrice,
        quantity: 1,
        total: itemPrice,
        unitIdentifiers: [unit.identifier],
        product: product,
        selectedUnits: [unit],
        image: product.image || null
      }]);
    }

    setLastAddedItem({
      name: product.name,
      image: product.image || null,
      category: product.category,
      quantity: 1,
      price: itemPrice
    });

    setImeiSearchTerm('');
    setImeiSearchResults([]);
    setShowImeiResults(false);
    
    if (imeiInputRef.current) {
      imeiInputRef.current.focus();
    }
  };

  const handleModalImeiResultClick = (unit) => {
    if (selectedUnits.includes(unit.identifier)) {
      setSelectedUnits(selectedUnits.filter(id => id !== unit.identifier));
    } else {
      setSelectedUnits([...selectedUnits, unit.identifier]);
    }
    
    setModalImeiSearchTerm('');
    setModalImeiResults([]);
    setShowModalImeiResults(false);
    
    if (modalImeiInputRef.current) {
      modalImeiInputRef.current.focus();
    }
  };

  const getFilteredProducts = () => {
    let filtered = [...products];
    
    if (selectedBranch) {
      filtered = filtered.filter(product => {
        if (!product.branch) return true;
        return product.branch === selectedBranch || product.branch?._id === selectedBranch;
      });
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => {
        return (product.name?.toLowerCase().includes(term) ||
                product.brand?.toLowerCase().includes(term) ||
                product.model?.toLowerCase().includes(term) ||
                product.sku?.toLowerCase().includes(term) ||
                product.barcode?.toLowerCase().includes(term) ||
                product.imei?.toLowerCase().includes(term) ||
                product.serialNumber?.toLowerCase().includes(term));
      });
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    filtered = filtered.filter(product => product.status === 'active');
    
    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const handleProductSelect = (product) => {
    console.log('Product selected:', product.name);
    setSelectedProduct(product);
    setQuantityInput(1);
    setSelectedUnits([]);
    setModalImeiSearchTerm('');
    setModalImeiResults([]);
    setShowModalImeiResults(false);
    setShowProductModal(true);
    
    setTimeout(() => {
      if (modalImeiInputRef.current) {
        modalImeiInputRef.current.focus();
      }
    }, 300);
  };

  const toggleUnitSelection = (identifier, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedUnits(prev => {
      if (prev.includes(identifier)) {
        return prev.filter(id => id !== identifier);
      } else {
        return [...prev, identifier];
      }
    });
  };

  const selectAllUnits = () => {
    const availableUnits = selectedProduct?.units?.filter(u => u.status === 'available') || [];
    const allIdentifiers = availableUnits.map(u => u.identifier);
    setSelectedUnits(allIdentifiers);
  };

  const deselectAllUnits = () => {
    setSelectedUnits([]);
  };

  const addToCartFromModal = () => {
    if (!selectedProduct) {
      console.error('No product selected');
      return;
    }

    console.log('Adding to cart:', selectedProduct.name);

    const productPrice = selectedProduct.price?.sale || selectedProduct.price || 0;

    if (selectedProduct.category === 'Accessories') {
      const stockAvailable = selectedProduct.stock?.quantity || 0;
      if (quantityInput > stockAvailable) {
        alert(`Not enough stock! Available: ${stockAvailable}`);
        return;
      }
      
      const existingItem = cart.find(item => item.productId === selectedProduct._id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantityInput;
        if (newQuantity > stockAvailable) {
          alert(`Not enough stock! Available: ${stockAvailable}`);
          return;
        }
        updateQuantity(selectedProduct._id, newQuantity);
      } else {
        addToCart(selectedProduct, quantityInput);
      }
    } else {
      if (selectedUnits.length === 0) {
        alert('Please select at least one unit');
        return;
      }

      const selectedUnitObjects = selectedProduct.units?.filter(u => 
        selectedUnits.includes(u.identifier) && u.status === 'available'
      ) || [];

      if (selectedUnitObjects.length === 0) {
        alert('No available units selected');
        return;
      }

      const existingItem = cart.find(item => item.productId === selectedProduct._id);
      if (existingItem) {
        const existingIdentifiers = existingItem.unitIdentifiers || [];
        const updatedUnits = [...existingIdentifiers, ...selectedUnits];
        const updatedItem = {
          ...existingItem,
          unitIdentifiers: updatedUnits,
          quantity: updatedUnits.length,
          total: updatedUnits.length * productPrice
        };
        setCart(cart.map(item => 
          item.productId === selectedProduct._id ? updatedItem : item
        ));
      } else {
        setCart([...cart, {
          productId: selectedProduct._id,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          category: selectedProduct.category,
          price: productPrice,
          quantity: selectedUnits.length,
          total: selectedUnits.length * productPrice,
          unitIdentifiers: selectedUnits,
          product: selectedProduct,
          selectedUnits: selectedUnitObjects,
          image: selectedProduct.image || null
        }]);
      }
    }
    
    setLastAddedItem({
      name: selectedProduct.name,
      image: selectedProduct.image || null,
      category: selectedProduct.category,
      quantity: selectedProduct.category === 'Accessories' ? quantityInput : selectedUnits.length,
      price: productPrice
    });
    
    setShowProductModal(false);
    setSelectedProduct(null);
    setSelectedUnits([]);
    setQuantityInput(1);
  };

  const addToCart = (product, quantity = 1) => {
    const productPrice = product.price?.sale || product.price || 0;
    
    setCart([...cart, {
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      price: productPrice,
      quantity: quantity,
      total: quantity * productPrice,
      unitIdentifiers: [],
      product: product,
      image: product.image || null
    }]);
    
    setLastAddedItem({
      name: product.name,
      image: product.image || null,
      category: product.category,
      quantity: quantity,
      price: productPrice
    });
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
    if (cart.length <= 1) {
      setLastAddedItem(null);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const total = newQuantity * item.price;
        return { ...item, quantity: newQuantity, total };
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = discount.type === 'percentage' 
      ? (subtotal * discount.value) / 100 
      : discount.value;
    const total = subtotal - discountAmount;
    return { subtotal, discountAmount, total };
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (!window.confirm('Clear all items from cart?')) return;
    setCart([]);
    setLastAddedItem(null);
    setCustomer({ name: '', phone: '', email: '' });
    setDiscount({ type: 'percentage', value: 0 });
    setPayment({ method: 'cash', amount: 0 });
    setShowMpesaPayment(false);
    setIsWaitingForPayment(false);
    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval);
      setPaymentCheckInterval(null);
    }
  };

  // ============================================
  // M-PESA FUNCTIONS
  // ============================================
  const handleMpesaSTKPush = async () => {
    const phoneRegex = /^[0-9]{10,12}$/;
    if (!mpesaData.phoneNumber || !phoneRegex.test(mpesaData.phoneNumber.replace(/[^0-9]/g, ''))) {
      alert('Please enter a valid phone number (e.g., 0712345678)');
      if (mpesaPhoneInputRef.current) {
        mpesaPhoneInputRef.current.focus();
      }
      return;
    }

    if (mpesaData.amount <= 0) {
      alert('Invalid payment amount');
      return;
    }

    setMpesaProcessing(true);
    setMpesaData({ ...mpesaData, status: 'processing' });

    try {
      const token = localStorage.getItem('token');
      const formattedPhone = mpesaData.phoneNumber.replace(/[^0-9]/g, '');
      
      const response = await fetch(`${API_URL}/mpesa/stk-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          amount: mpesaData.amount,
          accountReference: `POS-${Date.now()}`,
          transactionDesc: 'Payment for POS sale'
        })
      });

      const data = await response.json();

      if (data.success) {
        setMpesaData({
          ...mpesaData,
          status: 'success',
          transactionId: data.data?.transactionId || data.data?.CheckoutRequestID || 'Pending',
          paymentMethod: 'stk'
        });

        startWaitingForPayment(mpesaData.amount, formattedPhone);

      } else {
        throw new Error(data.message || 'STK Push failed');
      }

    } catch (error) {
      console.error('M-Pesa STK Push error:', error);
      setMpesaData({
        ...mpesaData,
        status: 'failed'
      });
      alert('M-Pesa STK Push failed: ' + error.message);
    } finally {
      setMpesaProcessing(false);
    }
  };

  const handleManualPayment = () => {
    const { total } = calculateTotals();
    startWaitingForPayment(total, customer.phone || '');
  };

  const startWaitingForPayment = (amount, phoneNumber) => {
    setIsWaitingForPayment(true);
    setDetectedPayment(null);
    setShowPaymentDetected(false);
    
    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval);
    }
    
    const interval = setInterval(async () => {
      await checkForPayment(amount, phoneNumber);
    }, 3000);
    
    setPaymentCheckInterval(interval);
  };

  const checkForPayment = async (amount, phoneNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/mpesa/check-payment?amount=${amount}&phone=${encodeURIComponent(phoneNumber)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const payment = data.data[0];
        setDetectedPayment(payment);
        setShowPaymentDetected(true);
        
        if (paymentCheckInterval) {
          clearInterval(paymentCheckInterval);
          setPaymentCheckInterval(null);
        }
        
        setTimeout(() => {
          confirmDetectedPayment(payment);
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    }
  };

  const confirmDetectedPayment = async (payment) => {
    setMpesaData({
      ...mpesaData,
      status: 'paid',
      transactionId: payment.mpesaCode || payment.transactionId || 'Auto-Detected',
      paymentMethod: 'manual'
    });

    setIsWaitingForPayment(false);
    setShowPaymentDetected(false);
    setShowMpesaPayment(false);

    setTimeout(() => {
      processSaleAfterMpesa();
    }, 500);
  };

  const searchPayment = async (searchValue) => {
    if (!searchValue || searchValue.length < 3) {
      setPaymentSearchResults([]);
      setShowPaymentSearchResults(false);
      return;
    }

    setSearchingPayment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/mpesa/search-payment?search=${encodeURIComponent(searchValue)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setPaymentSearchResults(data.data || []);
        setShowPaymentSearchResults(data.data?.length > 0);
      } else {
        setPaymentSearchResults([]);
        setShowPaymentSearchResults(false);
      }
    } catch (error) {
      console.error('Payment search error:', error);
      setPaymentSearchResults([]);
      setShowPaymentSearchResults(false);
    } finally {
      setSearchingPayment(false);
    }
  };

  const handlePaymentSearchResultClick = (paymentResult) => {
    const { total } = calculateTotals();
    
    setMpesaData({
      ...mpesaData,
      phoneNumber: paymentResult.phoneNumber || '',
      amount: paymentResult.amount || total,
      transactionId: paymentResult.mpesaCode || paymentResult.transactionId || '',
      status: 'paid'
    });

    setShowPaymentSearchResults(false);
    
    setTimeout(() => {
      processSaleAfterMpesa();
    }, 1000);
  };

  const processSaleAfterMpesa = async () => {
    try {
      await processSale();
      setShowMpesaPayment(false);
      setIsWaitingForPayment(false);
      if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        setPaymentCheckInterval(null);
      }
    } catch (error) {
      console.error('Error processing sale after M-Pesa:', error);
      alert('Sale processed but error occurred: ' + error.message);
    }
  };

  // ============================================
  // PROCESS SALE
  // ============================================
  const processSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    if (!selectedBranch) {
      alert('Please select a branch!');
      return;
    }

    if (payment.method !== 'mpesa') {
      if (payment.amount <= 0) {
        alert('Please enter payment amount!');
        return;
      }

      const { total } = calculateTotals();
      if (payment.amount < total) {
        alert(`Insufficient payment! Total: ${total}`);
        return;
      }
    }

    try {
      setProcessingSale(true);
      
      const saleData = {
        branch: selectedBranch,
        customer: customer,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          unitIdentifiers: item.unitIdentifiers || []
        })),
        payment: {
          method: payment.method,
          amount: payment.method === 'mpesa' ? mpesaData.amount : payment.amount,
          mpesaTransactionId: payment.method === 'mpesa' ? mpesaData.transactionId : undefined,
          mpesaPhoneNumber: payment.method === 'mpesa' ? mpesaData.phoneNumber : undefined,
          mpesaPaymentMethod: payment.method === 'mpesa' ? mpesaData.paymentMethod : undefined
        },
        discount: discount.value > 0 ? discount : undefined,
        notes: ''
      };

      console.log('📤 Processing sale:', saleData);

      const response = await saleService.createSale(saleData);
      
      if (response.success) {
        const sale = response.data;
        console.log('✅ Sale successful!', sale);
        
        setTimeout(() => {
          printReceipt(sale);
        }, 300);
        
        setSuccessMessage(`✅ Sale #${sale.saleNumber} completed!`);
        setShowSuccess(true);
        
        setCart([]);
        setLastAddedItem(null);
        setCustomer({ name: '', phone: '', email: '' });
        setDiscount({ type: 'percentage', value: 0 });
        setPayment({ method: 'cash', amount: 0 });
        setShowMpesaPayment(false);
        setIsWaitingForPayment(false);
        if (paymentCheckInterval) {
          clearInterval(paymentCheckInterval);
          setPaymentCheckInterval(null);
        }
        setMpesaData({
          phoneNumber: '',
          amount: 0,
          transactionId: '',
          status: 'pending',
          paymentMethod: 'stk'
        });
        
        const productsRes = await productService.getProducts();
        setProducts(productsRes.data || []);
        
      } else {
        alert('Error processing sale: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error processing sale:', error);
      alert('Error processing sale: ' + error.message);
    } finally {
      setProcessingSale(false);
    }
  };

  // ============================================
  // PRINT RECEIPT
  // ============================================
  const printReceipt = (sale) => {
    if (!sale) return;
    
    try {
      const printWindow = window.open('', '_blank', 'width=420,height=600,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes');
      
      if (!printWindow) {
        alert('Please allow popups to print the receipt');
        return;
      }

      const styles = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Courier New', monospace; 
          padding: 20px; 
          background: white;
          display: flex;
          justify-content: center;
        }
        .receipt-wrapper {
          max-width: 400px;
          width: 100%;
        }
        .receipt-content { padding: 20px; }
        .receipt-header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 12px;
          margin-bottom: 10px;
        }
        .receipt-company-name {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          text-transform: uppercase;
        }
        .receipt-company-tagline {
          font-size: 10px;
          color: #666;
          margin: 2px 0;
        }
        .receipt-company-info p {
          font-size: 11px;
          color: #555;
          margin: 1px 0;
        }
        .receipt-branch-name {
          font-weight: 600;
          font-size: 13px;
        }
        .receipt-divider {
          text-align: center;
          margin: 6px 0;
          color: #ccc;
          letter-spacing: 2px;
        }
        .receipt-info-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 12px;
        }
        .receipt-label { color: #888; }
        .receipt-value { font-weight: 600; }
        .receipt-items-header {
          display: grid;
          grid-template-columns: 2fr 0.6fr 0.8fr 0.8fr;
          gap: 4px;
          font-weight: 700;
          font-size: 11px;
          border-bottom: 1px dashed #000;
          padding-bottom: 4px;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .receipt-item-row {
          display: grid;
          grid-template-columns: 2fr 0.6fr 0.8fr 0.8fr;
          gap: 4px;
          padding: 3px 0;
          font-size: 12px;
          border-bottom: 1px dotted #eee;
        }
        .receipt-col-qty { text-align: center; }
        .receipt-col-price { text-align: right; }
        .receipt-col-total { text-align: right; font-weight: 600; }
        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 12px;
        }
        .receipt-total-row.grand {
          font-size: 16px;
          font-weight: 700;
          border-top: 2px solid #000;
          padding-top: 6px;
          margin-top: 4px;
        }
        .receipt-total-row.change { color: #28a745; font-weight: 600; }
        .receipt-served-by {
          text-align: center;
          font-size: 11px;
          color: #555;
          margin: 4px 0;
        }
        .receipt-served-by p { margin: 1px 0; }
        .receipt-footer { text-align: center; margin-top: 4px; }
        .receipt-thankyou { font-size: 13px; font-weight: 600; margin: 4px 0; }
        .receipt-tagline { font-size: 10px; color: #888; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      `;

      const branchData = sale.branch || {};
      const paymentData = sale.payment || {};

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${sale.saleNumber || 'TRONIC_MASTER'}</title>
            <style>${styles}</style>
          </head>
          <body>
            <div class="receipt-wrapper">
              <div class="receipt-content">
                <div class="receipt-header">
                  <h2 class="receipt-company-name">${user?.company?.name || 'TRONIC MASTER'}</h2>
                  <p class="receipt-company-tagline">Electronics & Gadgets Store</p>
                  <div class="receipt-company-info">
                    <p class="receipt-branch-name">${branchData.name || 'Main Branch'}</p>
                    <p>${branchData.address || ''}</p>
                    <p>Tel: ${branchData.phone || 'N/A'}</p>
                    <p>Email: ${branchData.email || 'info@tronic.com'}</p>
                  </div>
                </div>

                <div class="receipt-divider">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>

                <div class="receipt-info-section">
                  <div class="receipt-info-row">
                    <span class="receipt-label">Receipt #</span>
                    <span class="receipt-value">${sale.saleNumber || 'N/A'}</span>
                  </div>
                  <div class="receipt-info-row">
                    <span class="receipt-label">Date</span>
                    <span class="receipt-value">${sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div class="receipt-info-row">
                    <span class="receipt-label">Customer</span>
                    <span class="receipt-value">${sale.customer?.name || 'Walk-in Customer'}</span>
                  </div>
                  <div class="receipt-info-row">
                    <span class="receipt-label">Payment</span>
                    <span class="receipt-value" style="color:#0d6efd;font-weight:700;">${(paymentData.method || 'CASH').toUpperCase()}</span>
                  </div>
                </div>

                <div class="receipt-divider">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>

                <div class="receipt-items-section">
                  <div class="receipt-items-header">
                    <span>Item</span>
                    <span class="receipt-col-qty">Qty</span>
                    <span class="receipt-col-price">Price</span>
                    <span class="receipt-col-total">Total</span>
                  </div>
                  ${(sale.items || []).map(item => `
                    <div class="receipt-item-row">
                      <span>${item.productName || 'Unknown'}</span>
                      <span class="receipt-col-qty">${item.quantity || 0}</span>
                      <span class="receipt-col-price">${branchData.currencySymbol || 'KSh'} ${(item.unitPrice || 0).toLocaleString()}</span>
                      <span class="receipt-col-total">${branchData.currencySymbol || 'KSh'} ${(item.totalPrice || 0).toLocaleString()}</span>
                    </div>
                  `).join('')}
                </div>

                <div class="receipt-divider">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>

                <div class="receipt-totals-section">
                  <div class="receipt-total-row">
                    <span>Subtotal</span>
                    <span>${branchData.currencySymbol || 'KSh'} ${(sale.subtotal || 0).toLocaleString()}</span>
                  </div>
                  ${(sale.discount?.amount || 0) > 0 ? `
                    <div class="receipt-total-row discount" style="color:#dc3545;">
                      <span>Discount</span>
                      <span>- ${branchData.currencySymbol || 'KSh'} ${(sale.discount?.amount || 0).toLocaleString()}</span>
                    </div>
                  ` : ''}
                  <div class="receipt-total-row grand">
                    <span><strong>Total</strong></span>
                    <span><strong>${branchData.currencySymbol || 'KSh'} ${(sale.total || 0).toLocaleString()}</strong></span>
                  </div>
                  <div class="receipt-total-row">
                    <span>Amount Paid</span>
                    <span>${branchData.currencySymbol || 'KSh'} ${(paymentData.amount || 0).toLocaleString()}</span>
                  </div>
                  <div class="receipt-total-row change">
                    <span>Change</span>
                    <span>${branchData.currencySymbol || 'KSh'} ${(paymentData.change || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div class="receipt-divider">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>

                <div class="receipt-served-by">
                  <p><strong>Served By:</strong> ${user?.name || 'System'}</p>
                  <p><strong>Transaction ID:</strong> ${(sale._id || '').slice(-8)?.toUpperCase() || 'N/A'}</p>
                </div>

                <div class="receipt-divider">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>

                <div class="receipt-footer">
                  <p class="receipt-thankyou">Thank you for shopping with us!</p>
                  <p class="receipt-tagline">Quality Electronics & Gadgets</p>
                </div>
              </div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
    } catch (error) {
      console.error('Print error:', error);
      alert('Error printing receipt. Please try again.');
    }
  };

  const handleDismissSuccess = () => {
    setShowSuccess(false);
    setSuccessMessage('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getAvailableStock = (product) => {
    if (product.category === 'Accessories') {
      return product.stock?.quantity || 0;
    } else {
      return product.units?.filter(u => u.status === 'available').length || 0;
    }
  };

  const { subtotal, discountAmount, total } = calculateTotals();

  // ============================================
  // RENDER
  // ============================================
  return (
    <MainLayout title="Point of Sale" breadcrumbs={['Home', 'POS']}>
      <div className="pos-page" ref={posContainerRef}>
        {/* Fullscreen Toggle */}
        <div className="pos-fullscreen-control">
          <button 
            className="btn-fullscreen" 
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
          >
            {isFullscreen ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 01-2 2H3m0 0h18M5 14h3a2 2 0 012 2v3m0 0H3m18 0h-3a2 2 0 01-2-2v-3m0 0h3"/>
                </svg>
                <span className="fullscreen-label">Exit</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
                </svg>
                <span className="fullscreen-label">Fullscreen</span>
              </>
            )}
            <span className="fullscreen-shortcut">F11</span>
          </button>
        </div>

        {/* POS Header */}
        <div className="pos-header">
          <div className="pos-header-left">
            <h2>Point of Sale</h2>
          </div>
          <div className="pos-header-right">
            {isCashier ? (
              <div className="cashier-branch-display">
                <span className="branch-icon">🏪</span>
                <span className="branch-name">
                  {branches.length > 0 ? branches[0]?.name : 'Loading...'}
                </span>
                <span className="cashier-badge">Cashier</span>
              </div>
            ) : (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="branch-select"
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} ({branch.currencySymbol})
                  </option>
                ))}
              </select>
            )}
            <button className="btn-clear" onClick={clearCart}>
              🗑️ Clear Cart
            </button>
          </div>
        </div>

        {/* POS Layout - Left Products, Right Cart */}
        <div className="pos-layout">
          {/* Left: Products */}
          <div className="pos-products">
            <div className="pos-search">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search by name, brand, model, SKU, barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-filter"
              >
                <option value="all">All Categories</option>
                <option value="Phones">📱 Phones</option>
                <option value="Electronics">💻 Electronics</option>
                <option value="Accessories">🎧 Accessories</option>
              </select>
            </div>

            {/* IMEI/Serial Search */}
            <div className="imei-search-container">
              <div className="imei-search-wrapper">
                <span className="imei-search-icon">🔍</span>
                <input
                  ref={imeiInputRef}
                  type="text"
                  placeholder="Search IMEI / Serial Number to sell..."
                  value={imeiSearchTerm}
                  onChange={(e) => setImeiSearchTerm(e.target.value)}
                  className="imei-search-input"
                />
                {imeiSearchTerm && (
                  <button 
                    className="imei-search-clear"
                    onClick={() => {
                      setImeiSearchTerm('');
                      setImeiSearchResults([]);
                      setShowImeiResults(false);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {showImeiResults && imeiSearchResults.length > 0 && (
                <div className="imei-search-results">
                  {imeiSearchResults.map((result, index) => (
                    <div key={index} className="imei-result-group">
                      <div className="imei-result-product">
                        <span className="imei-product-name">{result.product.name}</span>
                        <span className="imei-product-price">
                          {getCurrencySymbol()} {result.product.price?.sale?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="imei-result-units">
                        {result.units.map((unit) => (
                          <div 
                            key={unit.identifier}
                            className="imei-result-unit"
                            onClick={() => handleImeiResultClick(result.product, unit)}
                          >
                            <span className="imei-unit-identifier">{unit.identifier}</span>
                            <button className="imei-unit-add">➕ Add</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {showImeiResults && imeiSearchResults.length === 0 && imeiSearchTerm.length >= 3 && (
                <div className="imei-search-results">
                  <div className="imei-no-results">
                    <span>📭</span>
                    <p>No IMEI/Serial found matching "{imeiSearchTerm}"</p>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className="loading-products">
                <div className="spinner"></div>
                <p>Loading products...</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.length === 0 ? (
                  <div className="no-products">
                    <span>📦</span>
                    <p>No products found</p>
                  </div>
                ) : (
                  filteredProducts.map(product => {
                    const stock = getAvailableStock(product);
                    const isOutOfStock = stock === 0;
                    const imageUrl = getProductImageUrl(product);
                    
                    return (
                      <div 
                        key={product._id} 
                        className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                        onClick={() => !isOutOfStock && handleProductSelect(product)}
                      >
                        {/* Product Image */}
                        <div className="product-image-container">
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={product.name} 
                              className="product-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement;
                                const fallback = parent.querySelector('.product-image-fallback');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div className="product-image-fallback">
                              <div className="no-image-text">
                                <span>📷</span>
                                <p>NO IMAGE</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="product-card-header">
                          <span className="product-category">{product.category}</span>
                          <span className={`stock-badge ${stock > 5 ? 'in-stock' : stock > 0 ? 'low-stock' : 'out-of-stock'}`}>
                            {product.category === 'Accessories' 
                              ? `${stock} in stock` 
                              : `${stock} units`}
                          </span>
                        </div>
                        <div className="product-card-body">
                          <h4>{product.name}</h4>
                          <p className="product-brand">{product.brand} - {product.model}</p>
                          {product.ram && product.rom && (
                            <p className="product-specs">RAM: {product.ram} | ROM: {product.rom}</p>
                          )}
                        </div>
                        <div className="product-card-footer">
                          <span className="product-price">
                            {getCurrencySymbol()} {product.price?.sale?.toLocaleString() || 0}
                          </span>
                          <button 
                            className={`btn-add ${isOutOfStock ? 'disabled' : ''}`}
                            disabled={isOutOfStock}
                            onClick={(e) => {
                              e.stopPropagation();
                              !isOutOfStock && handleProductSelect(product);
                            }}
                          >
                            {isOutOfStock ? 'Out of Stock' : '➕ Add'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Right: Cart */}
          <div className="pos-cart">
            <div className="cart-header">
              <h3>🛒 Cart</h3>
              <span className="cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <span>🛒</span>
                  <p>Cart is empty</p>
                  <p className="empty-hint">Add products from the left panel</p>
                  <p className="empty-hint" style={{ marginTop: '8px', fontSize: '12px', color: '#a0aec0' }}>
                    Press <kbd>Enter</kbd> to checkout
                  </p>
                </div>
              ) : (
                cart.map((item, index) => {
                  const cartImageUrl = getProductImageUrl(item.product || { image: item.image });
                  
                  return (
                    <div key={index} className="cart-item">
                      <div className="cart-item-image">
                        {cartImageUrl ? (
                          <img 
                            src={cartImageUrl} 
                            alt={item.productName} 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const parent = e.target.parentElement;
                              const fallback = parent.querySelector('.cart-item-fallback');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="cart-item-fallback">
                            {item.category === 'Phones' ? '📱' : 
                             item.category === 'Electronics' ? '💻' : 
                             item.category === 'Accessories' ? '🎧' : '📦'}
                          </div>
                        )}
                      </div>
                      
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.productName}</div>
                        {item.unitIdentifiers && item.unitIdentifiers.length > 0 && (
                          <div className="cart-item-units">
                            Units: {item.unitIdentifiers.join(', ')}
                          </div>
                        )}
                        <div className="cart-item-details">
                          <span className="cart-item-price">
                            {getCurrencySymbol()} {item.price.toLocaleString()} × {item.quantity}
                          </span>
                          <span className="cart-item-total">
                            Total: {getCurrencySymbol()} {item.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="cart-item-actions">
                        <button 
                          className="btn-qty"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="cart-item-qty">{item.quantity}</span>
                        <button 
                          className="btn-qty"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button 
                          className="btn-remove"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {lastAddedItem && (
              <div className="cart-image-preview">
                <div className="image-preview-header">
                  <span className="preview-label">📸 Last Added</span>
                  <span className="preview-count">×{lastAddedItem.quantity}</span>
                </div>
                <div className="single-image-preview">
                  {lastAddedItem.image ? (
                    <img 
                      src={getProductImageUrl({ image: lastAddedItem.image })} 
                      alt={lastAddedItem.name}
                      className="single-preview-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        const fallback = parent.querySelector('.single-preview-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="single-preview-fallback">
                      {lastAddedItem.category === 'Phones' ? '📱' : 
                       lastAddedItem.category === 'Electronics' ? '💻' : 
                       lastAddedItem.category === 'Accessories' ? '🎧' : '📦'}
                    </div>
                  )}
                  <div className="single-preview-info">
                    <span className="single-preview-name">{lastAddedItem.name}</span>
                    <span className="single-preview-price">
                      {getCurrencySymbol()} {lastAddedItem.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Info */}
            <div className="cart-customer">
              <h4>Customer Information</h4>
              <div className="customer-fields">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="customer-input"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="customer-input"
                />
                <input
                  type="email"
                  placeholder="Email (Optional)"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="customer-input"
                />
              </div>
            </div>

            {/* Discount */}
            <div className="cart-discount">
              <div className="discount-row">
                <span>Discount</span>
                <div className="discount-controls">
                  <select
                    value={discount.type}
                    onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
                    className="discount-type"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">Fixed</option>
                  </select>
                  <input
                    type="number"
                    placeholder="0"
                    value={discount.value}
                    onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                    className="discount-input"
                  />
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="cart-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>{getCurrencySymbol()} {subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="total-row discount">
                  <span>Discount</span>
                  <span>- {getCurrencySymbol()} {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="total-row grand-total">
                <span>Total</span>
                <span>{getCurrencySymbol()} {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="cart-payment">
              <div className="payment-row">
                <select
                  value={payment.method}
                  onChange={(e) => setPayment({ ...payment, method: e.target.value })}
                  className="payment-method"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="mpesa">📱 M-Pesa</option>
                  <option value="card">💳 Card</option>
                  <option value="bank">🏦 Bank Transfer</option>
                </select>
                {payment.method !== 'mpesa' && (
                  <input
                    type="number"
                    placeholder="Amount Paid"
                    value={payment.amount}
                    onChange={(e) => setPayment({ ...payment, amount: parseFloat(e.target.value) || 0 })}
                    className="payment-input"
                  />
                )}
                {payment.method === 'mpesa' && (
                  <div className="mpesa-indicator">
                    <span className="mpesa-badge">📱 M-Pesa</span>
                    <span className="mpesa-amount">{getCurrencySymbol()} {total.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {payment.method !== 'mpesa' && payment.amount > 0 && payment.amount >= total && (
                <div className="change-amount">
                  Change: {getCurrencySymbol()} {(payment.amount - total).toLocaleString()}
                </div>
              )}
            </div>

            {/* Process Button */}
            <button 
              className="btn-process"
              onClick={() => {
                if (payment.method === 'mpesa') {
                  const { total } = calculateTotals();
                  setMpesaData({
                    ...mpesaData,
                    amount: total,
                    phoneNumber: customer.phone || ''
                  });
                  setShowMpesaPayment(true);
                } else {
                  processSale();
                }
              }}
              disabled={cart.length === 0 || !selectedBranch || processingSale}
            >
              {processingSale ? (
                <>⏳ Processing...</>
              ) : payment.method === 'mpesa' ? (
                <>📱 Pay with M-Pesa <span className="shortcut-hint">(Enter)</span></>
              ) : (
                <>💳 Process Sale <span className="shortcut-hint">(Enter)</span></>
              )}
            </button>
          </div>
        </div>

        {/* Product Selection Modal */}
        {showProductModal && selectedProduct && (
          <div className="product-modal-overlay" onClick={() => setShowProductModal(false)}>
            <div className="product-modal" onClick={(e) => e.stopPropagation()}>
              <div className="product-modal-header">
                <h2>Add to Cart</h2>
                <button className="close-btn" onClick={() => setShowProductModal(false)}>✕</button>
              </div>
              <div className="product-modal-body">
                <div className="product-modal-info">
                  <h3>{selectedProduct.name}</h3>
                  <p className="product-modal-brand">Brand: {selectedProduct.brand} | Model: {selectedProduct.model}</p>
                  <p className="product-modal-category">Category: {selectedProduct.category}</p>
                  {selectedProduct.category === 'Phones' && (
                    <div className="product-modal-specs">
                      <p>RAM: {selectedProduct.ram || 'N/A'} | ROM: {selectedProduct.rom || 'N/A'}</p>
                    </div>
                  )}
                  <p className="product-modal-price">
                    Price: {getCurrencySymbol()} {selectedProduct.price?.sale?.toLocaleString() || 0} per unit
                  </p>
                </div>

                {selectedProduct.category === 'Accessories' ? (
                  <div className="product-modal-bulk">
                    <div className="bulk-info">
                      <p>Available Stock: {selectedProduct.stock?.quantity || 0}</p>
                      <p>SKU: {selectedProduct.sku}</p>
                    </div>
                    <div className="bulk-quantity">
                      <label>Quantity:</label>
                      <input
                        type="number"
                        min="1"
                        max={selectedProduct.stock?.quantity || 0}
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(Math.max(1, parseInt(e.target.value) || 1))}
                        className="quantity-input"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="product-modal-units-table">
                    <div className="units-table-header">
                      <div className="units-table-actions">
                        <span className="units-count">
                          Available: {selectedProduct.units?.filter(u => u.status === 'available').length || 0} units
                        </span>
                        <div className="units-actions">
                          <button className="btn-select-all" onClick={selectAllUnits}>
                            Select All
                          </button>
                          <button className="btn-deselect-all" onClick={deselectAllUnits}>
                            Deselect All
                          </button>
                        </div>
                      </div>
                      
                      <div className="modal-imei-search-wrapper">
                        <span className="modal-imei-search-icon">🔍</span>
                        <input
                          ref={modalImeiInputRef}
                          type="text"
                          placeholder="Quick search IMEI / Serial..."
                          value={modalImeiSearchTerm}
                          onChange={(e) => setModalImeiSearchTerm(e.target.value)}
                          className="modal-imei-search-input"
                        />
                        {modalImeiSearchTerm && (
                          <button 
                            className="modal-imei-search-clear"
                            onClick={() => {
                              setModalImeiSearchTerm('');
                              setModalImeiResults([]);
                              setShowModalImeiResults(false);
                              if (modalImeiInputRef.current) {
                                modalImeiInputRef.current.focus();
                              }
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      
                      {showModalImeiResults && modalImeiResults.length > 0 && (
                        <div className="modal-imei-results">
                          <div className="modal-imei-results-header">
                            <span>Found {modalImeiResults.length} matching unit(s)</span>
                            <span className="modal-imei-results-hint">Click to toggle selection</span>
                          </div>
                          <div className="modal-imei-results-list">
                            {modalImeiResults.map((unit) => {
                              const isSelected = selectedUnits.includes(unit.identifier);
                              let typeLabel = 'Unit';
                              if (selectedProduct.category === 'Phones') {
                                typeLabel = 'IMEI';
                              } else if (selectedProduct.category === 'Electronics') {
                                typeLabel = 'Serial';
                              }
                              
                              return (
                                <div 
                                  key={unit.identifier}
                                  className={`modal-imei-result-item ${isSelected ? 'selected' : ''}`}
                                  onClick={() => handleModalImeiResultClick(unit)}
                                >
                                  <span className="modal-imei-result-type">{typeLabel}</span>
                                  <span className="modal-imei-result-identifier">{unit.identifier}</span>
                                  <span className="modal-imei-result-status">
                                    {isSelected ? '✅ Selected' : '⬜ Click to select'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {showModalImeiResults && modalImeiResults.length === 0 && modalImeiSearchTerm.length >= 3 && (
                        <div className="modal-imei-no-results">
                          <span>📭</span>
                          <p>No IMEI/Serial found matching "{modalImeiSearchTerm}"</p>
                        </div>
                      )}
                      
                      <p className="units-instruction">Click the checkbox to select units to sell</p>
                    </div>
                    
                    <div className="units-table-container">
                      <table className="units-table">
                        <thead>
                          <tr>
                            <th className="col-select">Select</th>
                            <th className="col-identifier">#</th>
                            <th className="col-type">Type</th>
                            <th className="col-status">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProduct.units?.filter(u => u.status === 'available').length > 0 ? (
                            selectedProduct.units
                              .filter(u => u.status === 'available')
                              .map((unit, index) => {
                                const isSelected = selectedUnits.includes(unit.identifier);
                                let typeLabel = 'Unit';
                                if (selectedProduct.category === 'Phones') {
                                  typeLabel = 'IMEI';
                                } else if (selectedProduct.category === 'Electronics') {
                                  typeLabel = 'Serial';
                                }
                                
                                return (
                                  <tr key={unit.identifier} className={`unit-row ${isSelected ? 'selected' : ''}`}>
                                    <td className="col-select">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => toggleUnitSelection(unit.identifier, e)}
                                      />
                                    </td>
                                    <td className="col-identifier">{index + 1}</td>
                                    <td className="col-type">
                                      <span className="type-badge">{typeLabel}</span>
                                      <span className="identifier-value">{unit.identifier}</span>
                                    </td>
                                    <td className="col-status">
                                      <span className="status-badge available">Available</span>
                                    </td>
                                  </tr>
                                );
                              })
                          ) : (
                            <tr>
                              <td colSpan="4" className="no-units-row">
                                <div className="no-units-message">
                                  <span>📭</span>
                                  <p>No available units</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="units-selection-summary">
                      <span>Selected: <strong>{selectedUnits.length}</strong> units</span>
                      <span className="selection-total">
                        Total: {getCurrencySymbol()} {(selectedUnits.length * (selectedProduct.price?.sale || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="product-modal-footer">
                <button className="btn-cancel-modal" onClick={() => setShowProductModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-add-modal" 
                  onClick={addToCartFromModal}
                  disabled={
                    selectedProduct.category === 'Accessories' 
                      ? quantityInput < 1 || quantityInput > (selectedProduct.stock?.quantity || 0)
                      : selectedUnits.length === 0
                  }
                >
                  Add to Cart ({selectedProduct.category === 'Accessories' ? quantityInput : selectedUnits.length} items)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* M-Pesa Payment Modal */}
        {showMpesaPayment && (
          <div className="mpesa-modal-overlay" onClick={() => setShowMpesaPayment(false)}>
            <div className="mpesa-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mpesa-modal-header">
                <h2>📱 M-Pesa Payment</h2>
                <button className="close-btn" onClick={() => setShowMpesaPayment(false)}>✕</button>
              </div>
              <div className="mpesa-modal-body">
                <div className="mpesa-payment-summary">
                  <div className="mpesa-amount-display">
                    <span className="mpesa-amount-label">Amount to Pay</span>
                    <span className="mpesa-amount-value">
                      {getCurrencySymbol()} {mpesaData.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="mpesa-customer-info">
                    <div className="mpesa-info-row">
                      <span className="mpesa-info-label">Customer</span>
                      <span className="mpesa-info-value">{customer.name || 'Walk-in Customer'}</span>
                    </div>
                    {customer.phone && (
                      <div className="mpesa-info-row">
                        <span className="mpesa-info-label">Phone</span>
                        <span className="mpesa-info-value">{customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mpesa-payment-options">
                  <h4>Choose Payment Method</h4>
                  <div className="mpesa-options-grid">
                    <button 
                      className={`mpesa-option-btn ${mpesaData.paymentMethod === 'stk' ? 'active' : ''}`}
                      onClick={() => setMpesaData({ ...mpesaData, paymentMethod: 'stk' })}
                    >
                      <span className="mpesa-option-icon">📲</span>
                      <span className="mpesa-option-label">STK Push</span>
                      <span className="mpesa-option-desc">Send to customer's phone</span>
                    </button>
                    <button 
                      className={`mpesa-option-btn ${mpesaData.paymentMethod === 'manual' ? 'active' : ''}`}
                      onClick={() => {
                        setMpesaData({ ...mpesaData, paymentMethod: 'manual' });
                        handleManualPayment();
                      }}
                    >
                      <span className="mpesa-option-icon">💳</span>
                      <span className="mpesa-option-label">Manual Confirm</span>
                      <span className="mpesa-option-desc">Wait for payment</span>
                    </button>
                    <button 
                      className={`mpesa-option-btn ${mpesaData.paymentMethod === 'search' ? 'active' : ''}`}
                      onClick={() => {
                        setMpesaData({ ...mpesaData, paymentMethod: 'search' });
                        if (searchPaymentInputRef.current) {
                          searchPaymentInputRef.current.focus();
                        }
                      }}
                    >
                      <span className="mpesa-option-icon">🔍</span>
                      <span className="mpesa-option-label">Search Payment</span>
                      <span className="mpesa-option-desc">Find by code or phone</span>
                    </button>
                  </div>
                </div>

                {mpesaData.paymentMethod === 'stk' && (
                  <div className="mpesa-form">
                    <div className="form-group">
                      <label>📱 M-Pesa Phone Number</label>
                      <input
                        ref={mpesaPhoneInputRef}
                        type="tel"
                        placeholder="e.g., 0712345678"
                        value={mpesaData.phoneNumber}
                        onChange={(e) => setMpesaData({ ...mpesaData, phoneNumber: e.target.value })}
                        className="mpesa-phone-input"
                        disabled={mpesaProcessing || isWaitingForPayment}
                      />
                      <p className="mpesa-phone-hint">
                        Enter the phone number registered with M-Pesa
                      </p>
                    </div>
                  </div>
                )}

                {mpesaData.paymentMethod === 'search' && (
                  <div className="mpesa-search-form">
                    <div className="form-group">
                      <label>🔍 Search Payment</label>
                      <div className="mpesa-search-wrapper">
                        <input
                          ref={searchPaymentInputRef}
                          type="text"
                          placeholder="Enter M-Pesa Code or Phone Number..."
                          onChange={(e) => searchPayment(e.target.value)}
                          className="mpesa-search-input"
                        />
                        {searchingPayment && <div className="search-spinner-small"></div>}
                      </div>
                      <p className="mpesa-search-hint">
                        Search by M-Pesa confirmation code or customer phone number
                      </p>
                    </div>

                    {showPaymentSearchResults && paymentSearchResults.length > 0 && (
                      <div className="payment-search-results">
                        <div className="payment-search-header">
                          <span>Found {paymentSearchResults.length} payment(s)</span>
                        </div>
                        {paymentSearchResults.map((result, index) => (
                          <div 
                            key={index}
                            className="payment-search-item"
                            onClick={() => handlePaymentSearchResultClick(result)}
                          >
                            <div className="payment-search-info">
                              <span className="payment-search-code">
                                {result.mpesaCode || result.transactionId || 'N/A'}
                              </span>
                              <span className="payment-search-phone">
                                {result.phoneNumber || 'N/A'}
                              </span>
                              <span className="payment-search-amount">
                                {getCurrencySymbol()} {result.amount?.toLocaleString() || 0}
                              </span>
                            </div>
                            <span className="payment-search-status success">✅ Verified</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {showPaymentSearchResults && paymentSearchResults.length === 0 && (
                      <div className="payment-search-no-results">
                        <span>📭</span>
                        <p>No payments found</p>
                      </div>
                    )}
                  </div>
                )}

                {isWaitingForPayment && (
                  <div className="mpesa-waiting-state">
                    <div className="waiting-spinner"></div>
                    <h3 className="waiting-title">Waiting for Payment</h3>
                    <p className="waiting-description">
                      Waiting for M-Pesa payment confirmation from customer...
                    </p>
                    <div className="waiting-details">
                      <span>Amount: {getCurrencySymbol()} {mpesaData.amount.toLocaleString()}</span>
                      {mpesaData.phoneNumber && (
                        <span>Phone: {mpesaData.phoneNumber}</span>
                      )}
                    </div>
                  </div>
                )}

                {showPaymentDetected && detectedPayment && (
                  <div className="payment-detected-state">
                    <div className="detected-icon">✅</div>
                    <h3 className="detected-title">Payment Detected!</h3>
                    <p className="detected-description">
                      M-Pesa payment of {getCurrencySymbol()} {detectedPayment.amount?.toLocaleString()} confirmed
                    </p>
                    <div className="detected-details">
                      <span>Code: {detectedPayment.mpesaCode || detectedPayment.transactionId}</span>
                      <span>Phone: {detectedPayment.phoneNumber}</span>
                    </div>
                    <div className="detected-processing">
                      <div className="spinner-small"></div>
                      <span>Processing sale...</span>
                    </div>
                  </div>
                )}

                <div className="mpesa-status">
                  {mpesaData.status === 'pending' && !isWaitingForPayment && !showPaymentDetected && (
                    <div className="mpesa-status-pending">
                      <span className="status-icon">⏳</span>
                      <span>Select payment method and complete payment</span>
                    </div>
                  )}
                  {mpesaData.status === 'processing' && (
                    <div className="mpesa-status-processing">
                      <div className="spinner-small"></div>
                      <span>Processing payment... Please wait</span>
                    </div>
                  )}
                  {mpesaData.status === 'success' && !isWaitingForPayment && !showPaymentDetected && (
                    <div className="mpesa-status-success">
                      <span className="status-icon">✅</span>
                      <span>STK Push sent successfully!</span>
                      {mpesaData.transactionId && (
                        <span className="mpesa-transaction-id">
                          ID: {mpesaData.transactionId}
                        </span>
                      )}
                    </div>
                  )}
                  {mpesaData.status === 'paid' && (
                    <div className="mpesa-status-paid">
                      <span className="status-icon">✅</span>
                      <span>Payment confirmed! Processing sale...</span>
                    </div>
                  )}
                  {mpesaData.status === 'failed' && (
                    <div className="mpesa-status-failed">
                      <span className="status-icon">❌</span>
                      <span>Payment failed. Please try again.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mpesa-modal-footer">
                <button 
                  className="btn-cancel-mpesa" 
                  onClick={() => {
                    setShowMpesaPayment(false);
                    setIsWaitingForPayment(false);
                    if (paymentCheckInterval) {
                      clearInterval(paymentCheckInterval);
                      setPaymentCheckInterval(null);
                    }
                  }}
                  disabled={mpesaProcessing || isWaitingForPayment}
                >
                  Cancel
                </button>
                {mpesaData.paymentMethod === 'stk' && (
                  <button 
                    className="btn-pay-mpesa" 
                    onClick={handleMpesaSTKPush}
                    disabled={mpesaProcessing || !mpesaData.phoneNumber || mpesaData.status === 'success' || mpesaData.status === 'paid' || isWaitingForPayment}
                  >
                    {mpesaProcessing ? (
                      <>⏳ Sending...</>
                    ) : isWaitingForPayment ? (
                      <>⏳ Waiting...</>
                    ) : mpesaData.status === 'success' || mpesaData.status === 'paid' ? (
                      <>✅ Sent - Processing...</>
                    ) : (
                      <>📲 Send STK Push</>
                    )}
                  </button>
                )}
                {mpesaData.paymentMethod === 'search' && (
                  <button 
                    className="btn-pay-mpesa" 
                    onClick={() => {
                      if (paymentSearchResults.length > 0) {
                        handlePaymentSearchResultClick(paymentSearchResults[0]);
                      }
                    }}
                    disabled={!showPaymentSearchResults || paymentSearchResults.length === 0}
                  >
                    🔍 Use Found Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {showSuccess && (
          <div className="success-toast" onClick={handleDismissSuccess}>
            <div className="success-toast-content">
              <span className="success-toast-icon">✅</span>
              <span className="success-toast-message">{successMessage}</span>
              <span className="success-toast-hint">Press Enter to continue</span>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default POS;