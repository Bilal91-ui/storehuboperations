import React, { useState, useEffect } from 'react';
import './pricing.css';
import './sellerDashboard.css';

const Pricing = () => {

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    basePrice: 0,
    discountPercent: 0,
    promoStart: '',
    promoEnd: ''
  });
  const [notification, setNotification] = useState('');

  // ✅ Fetch products when page loads
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // --- HANDLERS ---
  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setFormData({
      basePrice: product.basePrice || 0,
      discountPercent: product.discountPercent || 0,
      promoStart: product.promoStart || '',
      promoEnd: product.promoEnd || ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateSalePrice = () => {
    const base = parseFloat(formData.basePrice) || 0;
    const discount = parseFloat(formData.discountPercent) || 0;
    if (discount <= 0) return base.toFixed(2);
    return (base - (base * (discount / 100))).toFixed(2);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${selectedProduct.id}/pricing`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            basePrice: parseFloat(formData.basePrice),
            discountPercent: parseFloat(formData.discountPercent),
            startDate: formData.promoStart,
            endDate: formData.promoEnd
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      setSelectedProduct(null);
      setNotification("Pricing updated successfully.");
      setTimeout(() => setNotification(""), 3000);

      // ✅ Refresh table from DB
      fetchProducts();

    } catch (error) {
      console.error(error);
      alert("Failed to update pricing");
    }
  };

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h2>Pricing & Promotions Management</h2>
      </div>

      {notification && (
        <div className="alert-success">✅ {notification}</div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Base Price</th>
            <th>Discount</th>
            <th>Sale Price</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="5">No products found</td>
            </tr>
          ) : (
            products.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>PKR {p.basePrice || p.price}</td>
                <td>
                  {p.discountPercent > 0
                    ? <span style={{color:'red'}}>{p.discountPercent}% OFF</span>
                    : 'None'}
                </td>
                <td>PKR {p.salePrice || p.price}</td>
                <td>
                  <button
                    className="action-btn"
                    onClick={() => handleEditClick(p)}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{width: '400px'}}>
            <h3>Edit: {selectedProduct.name}</h3>
            <form onSubmit={handleSave} className="pricing-form">

              <label>Base Price (PKR)</label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                required
              />

              <label>Discount %</label>
              <input
                type="number"
                name="discountPercent"
                value={formData.discountPercent}
                onChange={handleChange}
              />

              <div className="calculated-price">
                New Price: PKR {calculateSalePrice()}
              </div>

              {formData.discountPercent > 0 && (
                <>
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="promoStart"
                    value={formData.promoStart}
                    onChange={handleChange}
                    required
                  />

                  <label>End Date</label>
                  <input
                    type="date"
                    name="promoEnd"
                    value={formData.promoEnd}
                    onChange={handleChange}
                    required
                  />
                </>
              )}

              <div className="modal-actions" style={{marginTop:'20px'}}>
                <button type="submit" className="submit-button">Save</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedProduct(null)}
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
