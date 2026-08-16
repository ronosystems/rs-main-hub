import React, { useState, useEffect, useRef } from 'react';
import './ProductModal.css';

const ProductModal = ({ isOpen, onClose, onSave, product, categories }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [branches, setBranches] = useState([]);
  
  // ✅ Image state
  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [uploadingImage] = useState(false);
  const imageInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Phones',
    brand: '',
    model: '',
    ram: '',
    rom: '',
    specs: '',
    barcode: '',
    image: '',
    branch: null,
    price: {
      purchase: '',
      sale: '',
      best: ''
    },
    stock: {
      quantity: '',
      minLevel: '5'
    },
    units: []
  });

  const [identifierInput, setIdentifierInput] = useState('');
  const [unitStatus, setUnitStatus] = useState('available');
  const [bulkIdentifiers, setBulkIdentifiers] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [editingUnitIndex, setEditingUnitIndex] = useState(null);
  const [editingUnitValue, setEditingUnitValue] = useState('');
  const [editingUnitStatus, setEditingUnitStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stepErrors, setStepErrors] = useState({});
  const inputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  // Get branch currency
  const getBranchCurrency = (branchId) => {
    const branch = branches.find(b => b._id === branchId);
    if (branch) {
      return {
        symbol: branch.currencySymbol || 'KSh',
        code: branch.currency || 'KES',
        country: branch.country || ''
      };
    }
    return { symbol: 'KSh', code: 'KES', country: '' };
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBranches(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || 'Phones',
        brand: product.brand || '',
        model: product.model || '',
        ram: product.ram || '',
        rom: product.rom || '',
        specs: product.specs || '',
        barcode: product.barcode || '',
        image: product.image || '',
        branch: product.branch?._id || product.branch || null,
        price: {
          purchase: product.price?.purchase || '',
          sale: product.price?.sale || '',
          best: product.price?.best || ''
        },
        stock: {
          quantity: product.stock?.quantity || '',
          minLevel: product.stock?.minLevel || '5'
        },
        units: product.units || []
      });
      
      // ✅ Set image preview if product has image
      if (product.image) {
        const imageUrl = product.image.startsWith('http') 
          ? product.image 
          : `${API_URL}${product.image}`;
        setProductImagePreview(imageUrl);
        setProductImage(null);
      } else {
        setProductImagePreview(null);
        setProductImage(null);
      }
      
      setCurrentStep(2);
    } else {
      setFormData({
        name: '',
        category: 'Phones',
        brand: '',
        model: '',
        ram: '',
        rom: '',
        specs: '',
        barcode: '',
        image: '',
        branch: null,
        price: {
          purchase: '',
          sale: '',
          best: ''
        },
        stock: {
          quantity: '',
          minLevel: '5'
        },
        units: []
      });
      setProductImagePreview(null);
      setProductImage(null);
      setCurrentStep(1);
    }
    // Reset errors when product changes
    setStepErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, API_URL]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear error for this field
    if (stepErrors[name]) {
      setStepErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  // ✅ Handle image upload - fixed to properly set formData.image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.svg')) {
      alert('Please upload a valid image (JPEG, PNG, GIF, WEBP, or SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Preview the image
    const reader = new FileReader();
    reader.onload = (event) => {
      setProductImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
    setProductImage(file);
    
    // ✅ Set the image filename in formData for submission
    setFormData(prev => ({
      ...prev,
      image: file.name
    }));
  };

  // ✅ Remove image
  const handleRemoveImage = async () => {
    if (!window.confirm('Remove this product image?')) return;
    
    // If product exists, delete from server
    if (product?._id && formData.image) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products/${product._id}/image`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setProductImagePreview(null);
          setProductImage(null);
          setFormData(prev => ({ ...prev, image: '' }));
        }
      } catch (error) {
        console.error('Error removing image:', error);
        alert('Failed to remove image');
      }
    } else {
      setProductImagePreview(null);
      setProductImage(null);
      setFormData(prev => ({ ...prev, image: '' }));
    }
  };

  const handleAddUnit = () => {
    if (!identifierInput.trim()) {
      alert(`Please enter a ${getIdentifierLabel(formData.category)}`);
      return;
    }
    
    if (formData.units.some(u => u.identifier === identifierInput.trim())) {
      alert(`${getIdentifierLabel(formData.category)} already exists!`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      units: [...prev.units, { 
        identifier: identifierInput.trim(), 
        status: unitStatus 
      }]
    }));
    setIdentifierInput('');
  };

  const handleBulkAdd = () => {
    const identifiers = bulkIdentifiers.split('\n')
      .map(id => id.trim())
      .filter(id => id !== '');
    
    if (identifiers.length === 0) {
      alert('Please enter at least one identifier');
      return;
    }

    const existingIds = formData.units.map(u => u.identifier);
    const newUnits = identifiers
      .filter(id => !existingIds.includes(id))
      .map(id => ({ identifier: id, status: 'available' }));

    if (newUnits.length === 0) {
      alert('All identifiers already exist');
      return;
    }

    if (newUnits.length !== identifiers.length) {
      if (!window.confirm(`${identifiers.length - newUnits.length} identifier(s) already exist. Add ${newUnits.length} new ones?`)) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      units: [...prev.units, ...newUnits]
    }));
    setBulkIdentifiers('');
    setShowBulkAdd(false);
    alert(`✅ ${newUnits.length} units added successfully!`);
  };

  const handleStartEdit = (index) => {
    setEditingUnitIndex(index);
    setEditingUnitValue(formData.units[index].identifier);
    setEditingUnitStatus(formData.units[index].status);
  };

  const handleSaveEdit = (index) => {
    if (!editingUnitValue.trim()) {
      alert('Identifier cannot be empty');
      return;
    }

    const oldIdentifier = formData.units[index].identifier;
    if (editingUnitValue.trim() !== oldIdentifier && 
        formData.units.some((u, i) => i !== index && u.identifier === editingUnitValue.trim())) {
      alert(`${getIdentifierLabel(formData.category)} already exists!`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      units: prev.units.map((u, i) => 
        i === index ? { ...u, identifier: editingUnitValue.trim(), status: editingUnitStatus } : u
      )
    }));
    setEditingUnitIndex(null);
    setEditingUnitValue('');
    setEditingUnitStatus('');
  };

  const handleRemoveUnit = (index) => {
    if (!window.confirm('Remove this unit?')) return;
    setFormData(prev => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== index)
    }));
  };

  const getIdentifierLabel = (category) => {
    switch(category) {
      case 'Phones': return 'IMEI';
      case 'Electronics': return 'Serial Number';
      case 'Accessories': return 'Barcode';
      default: return 'Identifier';
    }
  };

  const getIdentifierPlaceholder = (category) => {
    switch(category) {
      case 'Phones': return 'Enter IMEI number (e.g., 123456789012345)';
      case 'Electronics': return 'Enter Serial Number (e.g., SN-2024-001)';
      case 'Accessories': return 'Enter Barcode (e.g., 8901234567890)';
      default: return 'Enter identifier';
    }
  };

  const getIdentifierIcon = (category) => {
    switch(category) {
      case 'Phones': return '📱';
      case 'Electronics': return '💻';
      case 'Accessories': return '🏷️';
      default: return '🔢';
    }
  };

  // ============================================
  // VALIDATE STEP 1
  // ============================================
  const validateStep1 = () => {
    const errors = {};
    let isValid = true;

    if (formData.category === 'Phones') {
      if (!formData.brand || !formData.brand.trim()) {
        errors.brand = 'Brand is required';
        isValid = false;
      }
      if (!formData.model || !formData.model.trim()) {
        errors.model = 'Model is required';
        isValid = false;
      }
      if (!formData.ram || !formData.ram.trim()) {
        errors.ram = 'RAM is required for phones';
        isValid = false;
      }
      if (!formData.rom || !formData.rom.trim()) {
        errors.rom = 'ROM is required for phones';
        isValid = false;
      }
    } else if (formData.category === 'Electronics') {
      if (!formData.name || !formData.name.trim()) {
        errors.name = 'Product name is required';
        isValid = false;
      }
      if (!formData.brand || !formData.brand.trim()) {
        errors.brand = 'Brand is required';
        isValid = false;
      }
      if (!formData.model || !formData.model.trim()) {
        errors.model = 'Model is required';
        isValid = false;
      }
      if (!formData.specs || !formData.specs.trim()) {
        errors.specs = 'Specifications are required';
        isValid = false;
      }
    } else if (formData.category === 'Accessories') {
      if (!formData.name || !formData.name.trim()) {
        errors.name = 'Product name is required';
        isValid = false;
      }
      if (!formData.brand || !formData.brand.trim()) {
        errors.brand = 'Brand is required';
        isValid = false;
      }
      if (!formData.model || !formData.model.trim()) {
        errors.model = 'Model is required';
        isValid = false;
      }
    }

    if (!formData.price?.purchase || parseFloat(formData.price.purchase) <= 0) {
      errors['price.purchase'] = 'Buying price is required and must be greater than 0';
      isValid = false;
    }

    if (!formData.price?.sale || parseFloat(formData.price.sale) <= 0) {
      errors['price.sale'] = 'Selling price is required and must be greater than 0';
      isValid = false;
    }

    setStepErrors(errors);
    
    if (!isValid) {
      setTimeout(() => {
        const firstError = document.querySelector('.error');
        if (firstError) {
          firstError.focus();
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
    
    return isValid;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBackStep = () => {
    setCurrentStep(1);
  };

  // ============================================
  // Handle Submit with image upload - FIXED
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isSingleItem = formData.category !== 'Accessories';
    
    if (isSingleItem && formData.units.length === 0) {
      alert(`Please add at least one unit with ${getIdentifierLabel(formData.category)}`);
      return;
    }

    const purchasePrice = parseFloat(formData.price.purchase) || 0;
    const salePrice = parseFloat(formData.price.sale) || 0;
    const bestPrice = parseFloat(formData.price.best) || 0;

    if (purchasePrice <= 0) {
      alert('Please enter a valid buying price greater than 0');
      return;
    }
    
    if (salePrice <= 0) {
      alert('Please enter a valid selling price greater than 0');
      return;
    }

    const branchValue = formData.branch && formData.branch.trim() !== '' 
      ? formData.branch 
      : null;

    let dataToSend = {
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      model: formData.model,
      ram: formData.ram,
      rom: formData.rom,
      specs: formData.specs,
      barcode: formData.barcode,
      image: formData.image,
      branch: branchValue,
      price: {
        purchase: purchasePrice,
        sale: salePrice,
        best: bestPrice
      },
      stock: {
        quantity: parseInt(formData.stock.quantity) || 0,
        minLevel: parseInt(formData.stock.minLevel) || 5
      }
    };

    // Add units for non-accessories
    if (formData.category !== 'Accessories') {
      dataToSend.units = formData.units;
    }

    // For Phones: generate name from brand + model if name is empty
    if (formData.category === 'Phones') {
      dataToSend.name = formData.name || `${formData.brand} ${formData.model}`.trim();
    }

    console.log('📤 Submitting product data:', dataToSend);
    
    // ✅ Call onSave with data and image file
    onSave(dataToSend, productImage);
  };

  // Close modal when clicking outside
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isSingleItem = formData.category !== 'Accessories';
  const isPhone = formData.category === 'Phones';
  const isElectronics = formData.category === 'Electronics';
  const isAccessory = formData.category === 'Accessories';
  const identifierLabel = getIdentifierLabel(formData.category);
  const identifierPlaceholder = getIdentifierPlaceholder(formData.category);
  const identifierIcon = getIdentifierIcon(formData.category);

  const filteredUnits = formData.units.filter(unit => {
    const matchesSearch = unit.identifier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || unit.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const currentCurrency = getBranchCurrency(formData.branch);

  const renderStepIndicator = () => {
    const totalSteps = 2;
    return (
      <div className="step-indicator">
        <div className="step-dots">
          {[...Array(totalSteps)].map((_, index) => (
            <div 
              key={index} 
              className={`step-dot ${currentStep === index + 1 ? 'active' : ''} ${index + 1 < currentStep ? 'completed' : ''}`}
              onClick={() => index + 1 < currentStep && setCurrentStep(index + 1)}
            >
              <span className="step-number">{index + 1}</span>
            </div>
          ))}
        </div>
        <div className="step-labels">
          <span className={`step-label ${currentStep === 1 ? 'active' : ''}`}>Product Details</span>
          <span className={`step-label ${currentStep === 2 ? 'active' : ''}`}>
            {isPhone ? 'IMEI Management' : isElectronics ? 'Serial Management' : 'Stock & Barcode Management'}
          </span>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER CATEGORY SPECIFIC FIELDS
  // ============================================
  const renderCategoryFields = () => {
    if (isPhone) {
      return (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>Brand <span className="required">*</span></label>
              <input 
                type="text" 
                name="brand" 
                value={formData.brand} 
                onChange={handleChange} 
                placeholder="e.g., Samsung" 
                className={stepErrors.brand ? 'error' : ''}
              />
              {stepErrors.brand && <span className="error-message">{stepErrors.brand}</span>}
            </div>
            <div className="form-group">
              <label>Model <span className="required">*</span></label>
              <input 
                type="text" 
                name="model" 
                value={formData.model} 
                onChange={handleChange} 
                placeholder="e.g., Galaxy A05" 
                className={stepErrors.model ? 'error' : ''}
              />
              {stepErrors.model && <span className="error-message">{stepErrors.model}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>RAM <span className="required">*</span></label>
              <input 
                type="text" 
                name="ram" 
                value={formData.ram} 
                onChange={handleChange} 
                placeholder="e.g., 4GB" 
                className={stepErrors.ram ? 'error' : ''}
              />
              {stepErrors.ram && <span className="error-message">{stepErrors.ram}</span>}
            </div>
            <div className="form-group">
              <label>ROM <span className="required">*</span></label>
              <input 
                type="text" 
                name="rom" 
                value={formData.rom} 
                onChange={handleChange} 
                placeholder="e.g., 64GB" 
                className={stepErrors.rom ? 'error' : ''}
              />
              {stepErrors.rom && <span className="error-message">{stepErrors.rom}</span>}
            </div>
          </div>
          <div className="form-group">
            <label>Product Name <span className="optional">(Optional)</span></label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g., Samsung Galaxy A05 (optional)" 
            />
            <small className="field-hint">💡 If left empty, name will be auto-generated from Brand + Model</small>
          </div>
        </>
      );
    } else if (isElectronics) {
      return (
        <>
          <div className="form-group">
            <label>Product Name <span className="required">*</span></label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g., Dell Inspiron 15" 
              className={stepErrors.name ? 'error' : ''}
            />
            {stepErrors.name && <span className="error-message">{stepErrors.name}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Brand <span className="required">*</span></label>
              <input 
                type="text" 
                name="brand" 
                value={formData.brand} 
                onChange={handleChange} 
                placeholder="e.g., Dell" 
                className={stepErrors.brand ? 'error' : ''}
              />
              {stepErrors.brand && <span className="error-message">{stepErrors.brand}</span>}
            </div>
            <div className="form-group">
              <label>Model <span className="required">*</span></label>
              <input 
                type="text" 
                name="model" 
                value={formData.model} 
                onChange={handleChange} 
                placeholder="e.g., Inspiron 15" 
                className={stepErrors.model ? 'error' : ''}
              />
              {stepErrors.model && <span className="error-message">{stepErrors.model}</span>}
            </div>
          </div>
          <div className="form-group">
            <label>Specifications <span className="required">*</span></label>
            <textarea 
              name="specs" 
              value={formData.specs} 
              onChange={handleChange} 
              placeholder="e.g., Intel Core i5, 8GB RAM, 512GB SSD, 15.6 inch display" 
              rows="2"
              className={stepErrors.specs ? 'error' : ''}
            />
            {stepErrors.specs && <span className="error-message">{stepErrors.specs}</span>}
          </div>
        </>
      );
    } else if (isAccessory) {
      return (
        <>
          <div className="form-row three-col">
            <div className="form-group">
              <label>Product Name <span className="required">*</span></label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g., Oraimo charger" 
                className={stepErrors.name ? 'error' : ''}
              />
              {stepErrors.name && <span className="error-message">{stepErrors.name}</span>}
            </div>
            <div className="form-group">
              <label>Brand <span className="required">*</span></label>
              <input 
                type="text" 
                name="brand" 
                value={formData.brand} 
                onChange={handleChange} 
                placeholder="e.g., Oraimo" 
                className={stepErrors.brand ? 'error' : ''}
              />
              {stepErrors.brand && <span className="error-message">{stepErrors.brand}</span>}
            </div>
            <div className="form-group">
              <label>Model <span className="required">*</span></label>
              <input 
                type="text" 
                name="model" 
                value={formData.model} 
                onChange={handleChange} 
                placeholder="e.g., Orm-001" 
                className={stepErrors.model ? 'error' : ''}
              />
              {stepErrors.model && <span className="error-message">{stepErrors.model}</span>}
            </div>
          </div>

          <div className="form-group barcode-field">
            <label>📱 Barcode Number <span className="optional">(Optional)</span></label>
            <div className="barcode-input-group">
              <input 
                type="text" 
                name="barcode" 
                value={formData.barcode} 
                onChange={handleChange} 
                placeholder="Enter barcode number (e.g., 8901234567890)" 
                className={stepErrors.barcode ? 'error' : ''}
              />
            </div>
            <small className="field-hint">💡 You can manually enter the barcode</small>
            {stepErrors.barcode && <span className="error-message">{stepErrors.barcode}</span>}
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{product ? '✏️ Edit Product' : '➕ Add New Product'}</h2>
            <span className="modal-subtitle">
              {currentStep === 1 ? 'Step 1 of 2: Product Details' : 'Step 2 of 2: Manage Units'}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {renderStepIndicator()}
        
        <form onSubmit={currentStep === 1 ? handleNextStep : handleSubmit}>
          <div className="modal-body">
            {/* STEP 1: Product Details */}
            {currentStep === 1 && (
              <div className="step-content step-1">
                {/* Row 1: Branch and Category */}
                <div className="form-row">
                  <div className="form-group">
                    <label>🏪 Branch <span className="optional">(Optional)</span></label>
                    <select
                      name="branch"
                      value={formData.branch || ''}
                      onChange={handleChange}
                      className={stepErrors.branch ? 'error' : ''}
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name} ({branch.city}, {branch.country}) - {branch.currencySymbol}
                        </option>
                      ))}
                    </select>
                    <small className="field-hint">💡 Assign this product to a specific branch location</small>
                  </div>
                  <div className="form-group">
                    <label>Category <span className="required">*</span></label>
                    <select 
                      name="category" 
                      value={formData.category} 
                      onChange={handleChange} 
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ✅ PRODUCT IMAGE UPLOAD */}
                <div className="form-group image-upload-group">
                  <label>📷 Product Image <span className="optional">(Optional)</span></label>
                  <div className="image-upload-container">
                    {productImagePreview ? (
                      <div className="image-preview-wrapper">
                        <img 
                          src={productImagePreview} 
                          alt="Product preview" 
                          className="image-preview"
                        />
                        <div className="image-preview-actions">
                          <button 
                            type="button" 
                            className="btn-change-image"
                            onClick={() => imageInputRef.current?.click()}
                          >
                            🔄 Change
                          </button>
                          <button 
                            type="button" 
                            className="btn-remove-image"
                            onClick={handleRemoveImage}
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="image-upload-placeholder"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <span className="upload-icon">📷</span>
                        <p>Click to upload product image</p>
                        <small>PNG, JPG, WEBP (Max 5MB)</small>
                      </div>
                    )}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                  {productImage && (
                    <small className="field-hint" style={{ color: '#0d6efd' }}>
                      ✅ Image ready to upload
                    </small>
                  )}
                </div>

                {/* Category Specific Fields */}
                {renderCategoryFields()}

                {/* Pricing Section */}
                <div className="pricing-section">
                  <div className="pricing-header">
                    <h4>💰 Pricing</h4>
                    <span className="pricing-required">
                      {formData.branch ? (
                        <>Currency: {currentCurrency.symbol} ({currentCurrency.code})</>
                      ) : (
                        'Select a branch to see currency'
                      )}
                    </span>
                  </div>
                  <div className="form-row three-col">
                    <div className="form-group">
                      <label>Buying Price <span className="required">*</span></label>
                      <input 
                        type="number" 
                        name="price.purchase" 
                        value={formData.price.purchase} 
                        onChange={handleChange} 
                        placeholder={`0.00 ${currentCurrency.symbol}`}
                        className={stepErrors['price.purchase'] ? 'error' : ''}
                      />
                      {stepErrors['price.purchase'] && <span className="error-message">{stepErrors['price.purchase']}</span>}
                    </div>
                    <div className="form-group">
                      <label>Selling Price <span className="required">*</span></label>
                      <input 
                        type="number" 
                        name="price.sale" 
                        value={formData.price.sale} 
                        onChange={handleChange} 
                        placeholder={`0.00 ${currentCurrency.symbol}`}
                        className={stepErrors['price.sale'] ? 'error' : ''}
                      />
                      {stepErrors['price.sale'] && <span className="error-message">{stepErrors['price.sale']}</span>}
                    </div>
                    <div className="form-group">
                      <label>Best Price <span className="optional">(Optional)</span></label>
                      <input 
                        type="number" 
                        name="price.best" 
                        value={formData.price.best} 
                        onChange={handleChange} 
                        placeholder={`0.00 ${currentCurrency.symbol}`}
                      />
                      <small className="field-hint">💡 Your best price for this product</small>
                    </div>
                  </div>
                  {formData.branch && (
                    <div className="currency-display">
                      <span className="currency-label">Currency: {currentCurrency.symbol} ({currentCurrency.code})</span>
                      <span className="currency-country">Country: {currentCurrency.country}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Units Management */}
            {currentStep === 2 && (
              <div className="step-content step-2">
                <div className="summary-card">
                  <div className="summary-item">
                    <span className="summary-label">Product</span>
                    <span className="summary-value">
                      {isPhone ? `${formData.brand} ${formData.model}` : formData.name}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Category</span>
                    <span className="summary-value">{formData.category}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Brand</span>
                    <span className="summary-value">{formData.brand}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Model</span>
                    <span className="summary-value">{formData.model}</span>
                  </div>
                  {isPhone && (
                    <>
                      <div className="summary-item">
                        <span className="summary-label">RAM</span>
                        <span className="summary-value">{formData.ram || 'N/A'}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">ROM</span>
                        <span className="summary-value">{formData.rom || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  {(isElectronics || isAccessory) && (
                    <>
                      <div className="summary-item">
                        <span className="summary-label">Specifications</span>
                        <span className="summary-value">{formData.specs || 'N/A'}</span>
                      </div>
                      {isAccessory && formData.barcode && (
                        <div className="summary-item">
                          <span className="summary-label">Barcode</span>
                          <span className="summary-value barcode-value">{formData.barcode}</span>
                        </div>
                      )}
                    </>
                  )}
                  {formData.branch && (
                    <div className="summary-item">
                      <span className="summary-label">Branch</span>
                      <span className="summary-value">
                        {branches.find(b => b._id === formData.branch)?.name || 'Assigned'}
                        {' '}
                        ({branches.find(b => b._id === formData.branch)?.currencySymbol || 'KSh'})
                      </span>
                    </div>
                  )}
                </div>

                {isSingleItem && (
                  <div className="units-section">
                    <div className="units-header">
                      <h4>{identifierIcon} {identifierLabel}s</h4>
                      <span className="units-count">{formData.units.length} units</span>
                    </div>

                    <div className="add-unit-form">
                      <div className="add-unit-input-group">
                        <input
                          type="text"
                          value={identifierInput}
                          onChange={(e) => setIdentifierInput(e.target.value)}
                          placeholder={identifierPlaceholder}
                          className="add-unit-input"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddUnit()}
                        />
                        <select 
                          value={unitStatus} 
                          onChange={(e) => setUnitStatus(e.target.value)}
                          className="add-unit-status"
                        >
                          <option value="available">Available</option>
                          <option value="reserved">Reserved</option>
                          <option value="repair">Repair</option>
                        </select>
                        <button type="button" className="btn-add-unit" onClick={handleAddUnit}>
                          ➕ Add
                        </button>
                        <button type="button" className="btn-bulk-add" onClick={() => setShowBulkAdd(!showBulkAdd)}>
                          📋 Bulk
                        </button>
                      </div>
                    </div>

                    {showBulkAdd && (
                      <div className="bulk-add-section">
                        <textarea
                          value={bulkIdentifiers}
                          onChange={(e) => setBulkIdentifiers(e.target.value)}
                          placeholder={`Enter one ${identifierLabel} per line...`}
                          rows="4"
                          className="bulk-textarea"
                        />
                        <div className="bulk-actions">
                          <button type="button" className="btn-bulk-confirm" onClick={handleBulkAdd}>
                            ✅ Add All
                          </button>
                          <button type="button" className="btn-bulk-cancel" onClick={() => setShowBulkAdd(false)}>
                            Cancel
                          </button>
                        </div>
                        <small className="field-hint">💡 Enter multiple {identifierLabel}s, one per line</small>
                      </div>
                    )}

                    <div className="units-search">
                      <input
                        type="text"
                        placeholder={`Search ${identifierLabel}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="units-search-input"
                      />
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="units-filter"
                      >
                        <option value="all">All Status</option>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="repair">Repair</option>
                        <option value="sold">Sold</option>
                      </select>
                    </div>

                    {filteredUnits.length > 0 ? (
                      <div className="units-list">
                        {filteredUnits.map((unit, index) => (
                          <div key={index} className="unit-item">
                            {editingUnitIndex === index ? (
                              <div className="unit-edit-form">
                                <input
                                  type="text"
                                  value={editingUnitValue}
                                  onChange={(e) => setEditingUnitValue(e.target.value)}
                                  className="unit-edit-input"
                                  autoFocus
                                />
                                <select
                                  value={editingUnitStatus}
                                  onChange={(e) => setEditingUnitStatus(e.target.value)}
                                  className="unit-edit-status"
                                >
                                  <option value="available">Available</option>
                                  <option value="reserved">Reserved</option>
                                  <option value="repair">Repair</option>
                                  <option value="sold">Sold</option>
                                </select>
                                <button type="button" className="btn-save-edit" onClick={() => handleSaveEdit(index)}>
                                  ✅ Save
                                </button>
                                <button type="button" className="btn-cancel-edit" onClick={() => setEditingUnitIndex(null)}>
                                  ✕ Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="unit-info">
                                  <span className="unit-identifier">{unit.identifier}</span>
                                  <span className={`unit-status-badge ${unit.status}`}>
                                    {unit.status}
                                  </span>
                                </div>
                                <div className="unit-actions">
                                  <button type="button" className="btn-edit-unit" onClick={() => handleStartEdit(index)}>
                                    ✏️
                                  </button>
                                  <button type="button" className="btn-remove-unit" onClick={() => handleRemoveUnit(index)}>
                                    🗑️
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-units-message">
                        <span>{identifierIcon}</span>
                        <p>No {identifierLabel}s added yet</p>
                        <small>Add {identifierLabel}s using the form above</small>
                      </div>
                    )}
                  </div>
                )}

                {isAccessory && (
                  <div className="stock-section">
                    <h4>📦 Stock Management</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Quantity <span className="required">*</span></label>
                        <input 
                          type="number" 
                          name="stock.quantity" 
                          value={formData.stock.quantity} 
                          onChange={handleChange} 
                          placeholder="0" 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label>Min Level</label>
                        <input 
                          type="number" 
                          name="stock.minLevel" 
                          value={formData.stock.minLevel} 
                          onChange={handleChange} 
                          placeholder="5" 
                        />
                        <small className="field-hint">💡 Alert when stock falls below this level</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            {currentStep === 2 && (
              <button type="button" className="btn-back" onClick={handleBackStep}>
                ⬅ Back
              </button>
            )}
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={uploadingImage}>
              {uploadingImage ? (
                <span>⏳ Uploading Image...</span>
              ) : currentStep === 1 ? (
                'Next ➡'
              ) : (
                product ? '💾 Update Product' : '➕ Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;