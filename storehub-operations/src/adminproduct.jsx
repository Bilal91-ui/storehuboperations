// ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import './adminproduct.css';
import './adminDashboard.css'; // Reusing generic admin styles (buttons, etc)

const ProductManagement = () => {
  const [categories, setCategories] = useState([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/categories');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to load categories');
      setCategories(data);
    } catch (err) {
      console.error(err);
      showNotify('Unable to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    const trimmedName = newCatName.trim();
    if (!trimmedName) return;

    try {
      const res = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to create category');

      setCategories(prev => [...prev, { id: data.id, name: trimmedName }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCatName('');
      setShowCatModal(false);
      showNotify(`Category "${trimmedName}" added.`);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Create category failed');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure? This will remove the category for all sellers.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to delete category');

      setCategories(prev => prev.filter(c => c.id !== id));
      showNotify('Category deleted.');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Delete category failed');
    }
  };

  // --- RENDER ---
  return (
    <div className="pm-container">
      <div className="pm-content">
        {notification && <div style={{ padding: '10px', background: '#dcfce7', color: '#166534', borderRadius: '6px', marginBottom: '15px' }}>✅ {notification}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Platform Categories</h3>
            <p style={{ margin: '8px 0 0', color: '#6b7280' }}>Admin adds categories here so sellers can assign them while creating products.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCatModal(true)}>+ Add Category</button>
        </div>

        <div className="cat-list" style={{ marginTop: '20px' }}>
          {loading ? (
            <div style={{ padding: '20px', color: '#4b5563' }}>Loading categories...</div>
          ) : categories.length === 0 ? (
            <div style={{ padding: '20px', color: '#9ca3af' }}>No categories found. Add one to make it available for sellers.</div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="cat-card">
                <div>
                  <div className="cat-name">{cat.name}</div>
                </div>
                <button className="btn-icon" title="Delete Category" onClick={() => handleDeleteCategory(cat.id)}>🗑️</button>
              </div>
            ))
          )}
        </div>
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