"use client"

import { useState } from "react"
import "./cart.css"
import Checkout from "./checkout"

function Cart() {
  const [showCheckout, setShowCheckout] = useState(false)

  const [cartItems, setCartItems] = useState([
    {
      id: "1",
      name: "SURF Excel 500g pack",
      price: 89.99,
      quantity: 1,
      image: "/surf.jpg",
    },
    {
      id: "2",
      name: "Rice 1kg pack",
      price: 350,
      quantity: 2,
      image: "/rice.jpg",
    },
    {
      id: "3",
      name: "Premium Coffee Maker",
      price: 149.99,
      quantity: 1,
      image: "/modern-coffee-maker.png",
    },
  ])

  const updateQuantity = (id, delta) => {
    setCartItems((items) =>
      items
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  const removeItem = (id) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = 10.0
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  const handleCheckout = () => {
    setShowCheckout(true)
  }

  const handleBackToCart = () => {
    setShowCheckout(false)
  }

  if (showCheckout) {
    return <Checkout cartItems={cartItems} onBack={handleBackToCart} />
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <h1>Shopping Cart</h1>
        <button className="back-btn" onClick={() => window.history.back()}>
          ← Back to Shopping
        </button>
      </header>

      <div className="cart-container">
        <div className="cart-items-section">
          <h2>Cart Items ({cartItems.length})</h2>
          {cartItems.length === 0 ? (
            <div className="empty-cart-message">
              <p>Your cart is empty</p>
              <button className="continue-shopping-btn">Continue Shopping</button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item-card">
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className="item-image" />
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p className="item-price">Rs {item.price.toLocaleString()}</p>
                    <div className="quantity-section">
                      <button onClick={() => updateQuantity(item.id, -1)} className="qty-btn">
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="qty-btn">
                        +
                      </button>
                    </div>
                  </div>
                  <div className="item-actions">
                    <p className="item-total">Rs {(item.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => removeItem(item.id)} className="remove-item-btn">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>Rs {subtotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Shipping:</span>
            <span>Rs {shipping.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Tax (8%):</span>
            <span>Rs {tax.toLocaleString()}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row total-row">
            <span>Total:</span>
            <span>Rs {total.toLocaleString()}</span>
          </div>
          <button className="checkout-button" disabled={cartItems.length === 0} onClick={handleCheckout}>
            Proceed to Checkout
          </button>
          <button className="continue-btn">Continue Shopping</button>
        </div>
      </div>
    </div>
  )
}
export default Cart