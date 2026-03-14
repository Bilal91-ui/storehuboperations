"use client"

import { useState, useEffect, useCallback } from "react"
import "./home.css"
import Login from "./login"
import Signup from "./signup"
import Checkout from "./checkout"
import OrderTracking from "./OrderTracking"
import OrderHistory from "./OrderHistory"
import OrderDetails from "./OrderDetails"
import AccountSettings from "./accountsettings"

function Home() {

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isOrdersSidebarOpen, setIsOrdersSidebarOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showOrderTracking, setShowOrderTracking] = useState(false)
  const [trackingOrderId, setTrackingOrderId] = useState("")
  const [showOrderHistory, setShowOrderHistory] = useState(false)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [user, setUser] = useState(null)
  const [featuredProducts, setFeaturedProducts] = useState([])

  const [cartItems, setCartItems] = useState([])

  const categories = [
    { id: "1", name: "Meat", },
    { id: "2", name: "Fruits", },
    { id: "3", name: "Vegatables", },
    { id: "4", name: "Dairy Products" },
    { id: "5", name: "Bakery and Breakfast" },
    { id: "6", name: "Beverages" },
    { id: "7", name: "Tea and Coffee", },
    { id: "8", name: "Groceries" },
  ]

  // Fetch cart items (used in multiple places)
  const fetchCart = useCallback(async () => {
    try {
      console.log("Fetching cart from http://localhost:5000/api/cart")
      const res = await fetch("http://localhost:5000/api/cart")
      console.log("Cart fetch response status:", res.status)
      if (!res.ok) {
        console.error("Cart fetch failed, status", res.status)
        return []
      }
      const data = await res.json()
      console.log("Cart data received:", data)

      const cartWithImages = data.map(item => ({
        ...item,
        image: item.image
          ? `http://localhost:5000${item.image}`
          : "/placeholder.svg"
      }))

      setCartItems(cartWithImages)
      return cartWithImages
    } catch (err) {
      console.error("Cart fetch error:", err)
      return []
    }
  }, [])

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products")
        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }
        const products = await response.json()

        // ✅ Map products to include full image URLs if they are stored as paths
        const productsWithImageUrls = products.map(product => ({
          ...product,
          image: product.image
            ? `http://localhost:5000${product.image}`  // full backend URL
            : '/placeholder.svg'  // fallback if no image
        }))

        setFeaturedProducts(productsWithImageUrls)
      } catch (error) {
        console.error("Error fetching products:", error)
        setFeaturedProducts([])
      }
    }

    fetchProducts()
    fetchCart()
  }, [fetchCart])


  const nearbyStores = [
    {
      id: "1",
      name: "Mandi Electronics",
      rating: 4.8,
      reviews: 1234,
      image: "/electronics-store-interior.png",
      distance: "0.5 km",
    },
    {
      id: "2",
      name: "Ahmad Super Store",
      rating: 4.6,
      reviews: 890,
      image: "/superstore.jpg",
      distance: "1.2 km",
    },
    {
      id: "3",
      name: "Greengrocers",
      rating: 4.7,
      reviews: 567,
      image: "/vegstore.jpg",
      distance: "0.8 km",
    },
    {
      id: "4",
      name: "Hafiz Sweets",
      rating: 4.5,
      reviews: 432,
      image: "/sweetstore.jpg",
      distance: "1.5 km",
    },
  ]
  const addToCart = async (productId) => {
    console.log("addToCart called with productId:", productId)
    try {
      console.log("Making fetch request to http://localhost:5000/api/cart")
      const resp = await fetch("http://localhost:5000/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1
        })
      })
      console.log("Response status:", resp.status)
      if (!resp.ok) {
        console.error("Add to cart failed, status", resp.status)
        const errorText = await resp.text()
        console.error("Error response:", errorText)
      } else {
        console.log("Add to cart successful")
      }

      // refresh cart (do not auto-open drawer)
      await fetchCart()
    } catch (err) {
      console.error("Add to cart error:", err)
    }
  }
  const updateCartItemQuantity = async (id, delta) => {
    try {
      const item = cartItems.find((i) => i.id === id)
      if (!item) return
      const newQty = Math.max(0, (item.quantity || 0) + delta)

      if (newQty === 0) {
        // delegate to remove handler which refreshes
        await removeCartItem(id)
        return
      }

      const resp = await fetch(`http://localhost:5000/api/cart/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty })
      })

      if (!resp.ok) {
        console.error("Update cart failed, status", resp.status)
        return
      }

      await fetchCart()
    } catch (err) {
      console.error("Update cart error:", err)
    }
  }

  const removeCartItem = async (id) => {
    try {
      const resp = await fetch(`http://localhost:5000/api/cart/${id}`, {
        method: "DELETE"
      })

      if (!resp.ok) {
        console.error("Remove cart failed, status", resp.status)
        return
      }

      // wait for the refreshed cart and close drawer if empty
      const updated = await fetchCart()
      if (!updated || updated.length === 0) setIsCartOpen(false)
    } catch (err) {
      console.error("Remove cart error:", err)
    }
  }

  const getEffectivePrice = (item) => {
    // Use salePrice if it's set and less than the original price
    if (item.salePrice && item.salePrice > 0 && item.salePrice < item.price) {
      return item.salePrice
    }
    return item.price
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + (parseFloat(getEffectivePrice(item)) || 0) * (item.quantity || 0), 0)
  const cartItemsCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setShowLogin(false)
  }

  const handleSignupSuccess = (userData) => {
    setUser(userData)
    setShowSignup(false)
  }

  const handleLogout = () => {
    setUser(null)
  }

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button className="menu-btn" onClick={() => setIsMobileSidebarOpen(true)}>
            ☰
          </button>
          <h1 className="logo">StoreHub</h1>
          <div className="header-actions">
            {user ? (
              <>
                <div className="user-info">
                  <span className="user-name">Hello, {user.name}</span>
                  <span className="user-role">{user.role}</span>
                </div>
                <button className="btn-secondary" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={() => setShowLogin(true)}>
                  Login
                </button>
                <button className="btn-primary" onClick={() => setShowSignup(true)}>
                  Sign Up
                </button>
              </>
            )}
            <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
              🛒{cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
            </button>
            <button className="menu-btn" onClick={() => setIsOrdersSidebarOpen(true)} title="Account & Orders">
              ☰
            </button>
          </div>
        </div>
      </header>

      <div className="layout">
        {/* Desktop Sidebar */}
        <aside className="sidebar desktop-only">
          <h2 className="sidebar-title">Categories</h2>
          <ul className="category-list">
            {categories.map((category) => (
              <li key={category.id} className="category-item">
                <span>{category.name}</span>
                <span className="category-count">{category.count}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Mobile Sidebar */}
        {isMobileSidebarOpen && (
          <>
            <div className="overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            <aside className="sidebar mobile-sidebar">
              <div className="sidebar-header">
                <h2>Categories</h2>
                <button className="close-btn" onClick={() => setIsMobileSidebarOpen(false)}>
                  ✕
                </button>
              </div>
              <ul className="category-list">
                {categories.map((category) => (
                  <li key={category.id} className="category-item">
                    <span>{category.name}</span>
                    <span className="category-count">{category.count}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="main-content">
          {/* Search Bar */}
          <div className="search-container">
            <input type="text" placeholder="Search for products..." className="search-input" />
          </div>

          {/* Featured Products */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Featured Products</h2>
              <button className="view-all-btn">View All →</button>
            </div>
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <div key={product.id} className="product-card">
                  {product.badge && <span className={`badge ${product.badge.toLowerCase()}`}>{product.badge}</span>}
                  <img src={product.image} alt={product.name} className="product-image" onError={(e) => { e.target.src = '/placeholder.svg' }} />
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    {product.rating && (
                      <div className="product-rating">
                        ⭐ {product.rating} ({product.reviews})
                      </div>
                    )}
                    <div className="product-price">
                      {product.salePrice > 0 && product.basePrice > 0 ? (
                        <>
                          <span className="price">Rs {product.salePrice}</span>
                          <span className="original-price">Rs {product.basePrice}</span>
                        </>
                      ) : (
                        <span className="price">Rs {product.price}</span>
                      )}
                    </div>
                    <button
                      className="add-to-cart-btn"
                      onClick={() => addToCart(product.id)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Nearby Stores */}
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Stores Near You</h2>
                <p className="section-subtitle">Shop from trusted local stores</p>
              </div>
              <button className="view-all-btn">View All →</button>
            </div>
            <div className="stores-grid">
              {nearbyStores.map((store) => (
                <div key={store.id} className="store-card">
                  <img src={`${process.env.PUBLIC_URL}${store.image}`} alt={store.name} className="store-image" onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/placeholder.svg` }} />
                  <div className="store-info">
                    <h3 className="store-name">{store.name}</h3>
                    <div className="store-meta">
                      <span className="store-rating">⭐ {store.rating}</span>
                      <span className="store-distance">📍 {store.distance}</span>
                    </div>
                    <p className="store-reviews">{store.reviews} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Hot Deals */}
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Hot Deals</h2>
                <p className="section-subtitle">Limited time offers on your favorite items</p>
              </div>
              <button className="view-all-btn">View All →</button>
            </div>
            <div className="products-grid">
              {featuredProducts
                .filter((p) => p.badge === "Sale")
                .map((product) => (
                  <div key={product.id} className="product-card">
                    <span className="badge sale">{product.badge}</span>
                    <img src={product.image || '/placeholder.svg'} alt={product.name} className="product-image" onError={(e) => { e.target.src = '/placeholder.svg' }} />
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      {product.rating && (
                        <div className="product-rating">
                          ⭐ {product.rating} ({product.reviews})
                        </div>
                      )}
                      <div className="product-price">
                        {product.salePrice > 0 && product.basePrice > 0 ? (
                          <>
                            <span className="price">Rs {product.salePrice}</span>
                            <span className="original-price">Rs {product.basePrice}</span>
                          </>
                        ) : (
                          <span className="price">Rs {product.price}</span>
                        )}
                      </div>
                      <button
                        className="add-to-cart-btn"
                        onClick={() => addToCart(product.id)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </main>
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          <div className="overlay" onClick={() => setIsCartOpen(false)}></div>
          <div className="cart-drawer">
            <div className="cart-header">
              <h2>Shopping Cart ({cartItemsCount})</h2>
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>
                ✕
              </button>
            </div>
            <div className="cart-content">
              {cartItems.length === 0 ? (
                <p className="empty-cart">Your cart is empty</p>
              ) : (
                <>
                  {cartItems.map((item) => (
                    <div key={item.id} className="cart-item">
                      <img className="cart-item-image" src={item.image} />
                      <div className="cart-item-info">
                        <h4>{item.name}</h4>
                        <div className="cart-item-price">
                          {item.salePrice && item.salePrice > 0 && item.salePrice < item.price ? (
                            <>
                              <span className="discounted-price">Rs {item.salePrice}</span>
                              <span className="original-price">Rs {item.price}</span>
                            </>
                          ) : (
                            <span>Rs {item.price}</span>
                          )}
                        </div>
                        <div className="quantity-controls">
                          <button onClick={() => updateCartItemQuantity(item.id, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateCartItemQuantity(item.id, 1)}>+</button>
                        </div>
                      </div>
                      <button className="remove-btn" onClick={() => removeCartItem(item.id)}>
                        🗑️
                      </button>
                    </div>
                  ))}
                  <div className="cart-footer">
                    <div className="cart-total">
                      <span>Total:</span>
                      <span className="total-amount">{cartTotal.toFixed(2)}</span>
                    </div>
                    <button className="checkout-btn" onClick={() => setShowCheckout(true)}>Proceed to Checkout</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false)
            setShowSignup(true)
          }}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {showSignup && (
        <Signup
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false)
            setShowLogin(true)
          }}
          onSignupSuccess={handleSignupSuccess}
        />
      )}

      {showCheckout && (
        <Checkout
          cartItems={cartItems}
          onBack={() => setShowCheckout(false)}
          onTrackOrder={(orderId) => {
            setTrackingOrderId(orderId)
            setShowOrderTracking(true)
          }}
        />
      )}

      {showOrderTracking && (
        <OrderTracking
          onClose={() => {
            setShowOrderTracking(false)
            setTrackingOrderId("")
          }}
          initialOrderId={trackingOrderId}
        />
      )}

      {showOrderHistory && (
        <OrderHistory
          onClose={() => setShowOrderHistory(false)}
          onViewOrderDetails={(order) => {
            setSelectedOrder(order)
            setShowOrderDetails(true)
            setShowOrderHistory(false)
          }}
        />
      )}

      {showOrderDetails && selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => {
            setShowOrderDetails(false)
            setSelectedOrder(null)
            setShowOrderHistory(true) // Go back to order history
          }}
          onOrderCancelled={(cancelledOrder) => {
            setSelectedOrder(cancelledOrder)
            // In a real app, this would update the orders in the backend
            alert("Order has been cancelled and will be removed from your order history.")
          }}
        />
      )}

      {showAccountSettings && (
        <AccountSettings
          onClose={() => setShowAccountSettings(false)}
          user={user}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {/* Orders Sidebar */}
      {isOrdersSidebarOpen && (
        <>
          <div className="orders-sidebar-overlay" onClick={() => setIsOrdersSidebarOpen(false)}></div>
          <aside className="orders-sidebar">
            <div className="orders-sidebar-header">
              <h2 className="orders-sidebar-title">Account & Orders</h2>
              <button className="orders-sidebar-close" onClick={() => setIsOrdersSidebarOpen(false)}>
                ✕
              </button>
            </div>
            <div className="orders-sidebar-content">
              <div className="orders-sidebar-section">
                <button
                  className="orders-sidebar-btn"
                  onClick={() => {
                    setIsOrdersSidebarOpen(false)
                    setShowOrderHistory(true)
                  }}
                >
                  📋 Order History
                </button>
              </div>
              <div className="orders-sidebar-section">
                <button
                  className="orders-sidebar-btn"
                  onClick={() => {
                    setIsOrdersSidebarOpen(false)
                    setShowOrderTracking(true)
                  }}
                >
                  📦 Track Order
                </button>
              </div>
              <div className="orders-sidebar-section">
                <button
                  className="orders-sidebar-btn"
                  onClick={() => {
                    setIsOrdersSidebarOpen(false)
                    setShowAccountSettings(true)
                  }}
                >
                  ⚙️ Account Settings
                </button>
              </div>
              <div className="orders-sidebar-section">
                <button
                  className="orders-sidebar-btn logout-btn"
                  onClick={() => {
                    setIsOrdersSidebarOpen(false)
                    handleLogout()
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}

export default Home
