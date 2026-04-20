import React, { useState, useEffect } from "react";
import axios from "axios";
import "./sellerDashboard.css";

const ManageProduct = () => {
  const [view, setView] = useState("list");
  const [notification, setNotification] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    image: null,      // actual file
    preview: null     // preview only
  });

  // ✅ Fetch products
  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Proper Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  // ✅ Proper Submit using FormData
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.stock) {
      return alert("Fill required fields");
    }

    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock, 10);

    if (price <= 0) {
      return alert("Price must be a positive number");
    }

    if (stock < 0) {
      return alert("Stock cannot be negative");
    }

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("price", price);
      data.append("stock", stock);
      data.append("category", formData.category);
      data.append("description", formData.description);

      if (formData.image) {
        data.append("image", formData.image);
      }

      const getSellerSession = () => {
        const saved = localStorage.getItem('sellerData') || localStorage.getItem('storehubOperationsSession');
        if (!saved) return null;
        try {
          return JSON.parse(saved);
        } catch (err) {
          console.warn('Invalid seller session data', err);
          return null;
        }
      };

      const sellerData = getSellerSession();
      if (sellerData) {
        const seller_id = sellerData.seller_id || sellerData.sellerId;
        if (seller_id) data.append('seller_id', seller_id);
      }

      if (currentId) {
        await axios.put(
          `http://localhost:5000/api/products/${currentId}`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        showNotification("Product updated");
      } else {
        await axios.post(
          "http://localhost:5000/api/products",
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        showNotification("Product added successfully!");
      }

      fetchProducts();
      setFormData({
        name: "",
        price: "",
        stock: "",
        category: "",
        description: "",
        image: null,
        preview: null
      });

      setCurrentId(null);
      setView("list");

    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  const startEdit = (product) => {
    setCurrentId(product.id);
    setFormData({
      name: product.name || "",
      price: product.price ? String(product.price) : "",
      stock: product.stock ? String(product.stock) : "",
      category: product.category || "",
      description: product.description || "",
      image: null,
      preview: product.image
        ? `http://localhost:5000${product.image}`
        : null
    });
    setView("add");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      fetchProducts();
      showNotification("Product deleted");
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- RENDER ----------------

  if (view === "add") {
    return (
      <div className="dashboard-section">
        <h2>{currentId ? "Edit Product" : "Add Product"}</h2>

        {notification && <div className="notification">{notification}</div>}

        <form onSubmit={handleSubmit} className="settings-form">

          <label>Name *</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />

          <label>Price *</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            min="0.01"
            step="0.01"
          />

          <label>Stock *</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleInputChange}
            required
            min="0"
          />

          <label>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          {categories.length === 0 && (
            <div style={{ color: '#d97706', fontSize: '0.9rem', marginTop: '6px' }}>
              No categories available. Please ask admin to add categories first.
            </div>
          )}

          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
          />

          <label>Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />

          {formData.preview && (
            <img
              src={formData.preview}
              alt="preview"
              style={{ width: 120, marginTop: 10 }}
            />
          )}

          <button type="submit" className="submit-button">
            Save Product
          </button>

          <button
            type="button"
            onClick={() => setView("list")}
            className="add-btn"
          >
            Back
          </button>

        </form>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <h2>Product Management</h2>

      <button
        className="add-btn"
        onClick={() => {
          setCurrentId(null);
          setFormData({
            name: "",
            price: "",
            stock: "",
            category: "",
            description: "",
            image: null,
            preview: null
          });
          setView("add");
        }}
      >
        + Add Product
      </button>

      {notification && <div className="notification">{notification}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="6">No products found</td>
            </tr>
          ) : (
            products.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.image ? (
                    <img
                      src={`http://localhost:5000${p.image}`}
                      alt=""
                      style={{ width: 50 }}
                    />
                  ) : (
                    "No Image"
                  )}
                </td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{p.stock}</td>
                <td>PKR {p.price}</td>
                <td>
                  <button onClick={() => startEdit(p)}>Edit</button>
                  <button
                    style={{ background: "red", color: "white" }}
                    onClick={() => handleDelete(p.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ManageProduct;
