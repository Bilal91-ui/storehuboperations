const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    const resp = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test',
        customer_email: 'test@example.com',
        customer_phone: '03001234567',
        shipping_address: '123 Main St',
        payment_method: 'cod',
        cart_items: [{ product_id: 1, name: 'Test', price: 100, quantity: 2 }],
        subtotal: 200,
        tax_amount: 16
      })
    });

    console.log('status', resp.status);
    console.log(await resp.text());
  } catch (err) {
    console.error(err);
  }
})();
