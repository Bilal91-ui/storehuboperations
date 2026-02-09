// ProductManagement.jsx
import React, { useState } from 'react';
import './adminproduct.css';
import './adminDashboard.css'; // Reusing generic admin styles (buttons, etc)

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' or 'products'
  const [notification, setNotification] = useState('');

  // --- 1. CATEGORY DATA & LOGIC ---
  const [categories, setCategories] = useState([
    { id: 1, name: 'Electronics', count: 120 },
    { id: 2, name: 'Fashion', count: 340 },
    { id: 3, name: 'Home & Garden', count: 85 },
    { id: 4, name: 'Food & Beverage', count: 210 },
  ]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // 4. Create/Delete Categories
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = { id: Date.now(), name: newCatName, count: 0 };
    setCategories([...categories, newCat]);
    setNewCatName('');
    setShowCatModal(false);
    showNotify(`Category "${newCat.name}" created successfully.`);
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm("Are you sure? This will affect products in this category.")) {
      setCategories(categories.filter(c => c.id !== id));
      showNotify("Category deleted.");
    }
  };

  // --- 2. PRODUCT DATA & LOGIC ---
  const [products, setProducts] = useState([
    { id: 101, name: 'iPhone 15 Pro', vendor: 'Tech World', category: 'Electronics', price: '$999', status: 'Live', img: null },
    { id: 102, name: 'Spicy Burger', vendor: 'Burger King', category: 'Food & Beverage', price: '$12', status: 'Pending', img: null },
    { id: 103, name: 'Herbal Supplement', vendor: 'Green Life', category: 'Health', price: '$45', status: 'Flagged', img: null },
    { id: 104, name: 'Leather Jacket', vendor: 'Zara Outlet', category: 'Fashion', price: '$150', status: 'Live', img: null },
  ]);

  // 5. & 6. Review & Actions
  const handleProductAction = (id, action) => {
    let msg = "";
    const updatedProducts = products.map(p => {
      if (p.id === id) {
        if (action === 'approve') { msg = "Product Approved"; return { ...p, status: 'Live' }; }
        if (action === 'remove') { msg = "Product Removed"; return null; } // Remove from list
        if (action === 'correction') { msg = "Correction Requested sent to Vendor"; return { ...p, status: 'Flagged' }; }
      }
      return p;
    }).filter(Boolean); // Filter out nulls (removed products)

    setProducts(updatedProducts);
    showNotify(msg);
  };

  // --- HELPERS ---
  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // --- RENDER ---
  return (
    <div className="pm-container">
      {/* Tabs */}
      <div className="pm-tabs">
        <div className={`pm-tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
          Categories
        </div>
        <div className={`pm-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          Product Oversight
        </div>
      </div>

      <div className="pm-content">
        {notification && <div style={{padding:'10px', background:'#dcfce7', color:'#166534', borderRadius:'6px', marginBottom:'15px'}}>✅ {notification}</div>}

        {/* --- CATEGORIES TAB --- */}
        {activeTab === 'categories' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3 style={{margin:0}}>All Categories</h3>
              <button className="btn btn-primary" onClick={() => setShowCatModal(true)}>+ Add Category</button>
            </div>
            
            <div className="cat-list">
              {categories.map(cat => (
                <div key={cat.id} className="cat-card">
                  <div>
                    <div className="cat-name">{cat.name}</div>
                    <div className="cat-count">{cat.count} listings</div>
                  </div>
                  <button className="btn-icon" title="Delete Category" onClick={() => handleDeleteCategory(cat.id)}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
          <div>
            <h3 style={{marginTop:0, marginBottom:'20px'}}>Vendor Listings Review</h3>
            <div className="admin-table-container" style={{boxShadow:'none', border:'1px solid #e5e7eb'}}>
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Vendor</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="prod-cell">
                          <div className="prod-img"></div> {/* Placeholder for img */}
                          <div className="prod-info">
                            <div>{p.name}</div>
                            <span>ID: #{p.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>{p.vendor}</td>
                      <td>{p.category}</td>
                      <td>{p.price}</td>
                      <td>
                        <span className={`p-badge ${p.status === 'Live' ? 'pb-live' : p.status === 'Pending' ? 'pb-pending' : 'pb-flagged'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-menu">
                          {p.status === 'Pending' && (
                            <button className="btn-sm btn-success" onClick={() => handleProductAction(p.id, 'approve')}>Approve</button>
                          )}
                          <button className="btn-sm btn-outline" onClick={() => handleProductAction(p.id, 'correction')}>Correct</button>
                          <button className="btn-sm btn-danger" onClick={() => handleProductAction(p.id, 'remove')}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:'30px', color:'#999'}}>No products found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'400px'}}>
            <h3 style={{marginTop:0}}>Create Category</h3>
            <div className="input-group">
              <label>Category Name</label>
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Sports Equipment" autoFocus />
            </div>
            <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={handleAddCategory}>Create</button>
              <button className="btn btn-outline" style={{flex:1}} onClick={() => setShowCatModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;