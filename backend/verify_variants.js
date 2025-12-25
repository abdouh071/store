const mongoose = require('mongoose');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function verify() {
  try {
    // Connect to DB
    const uri = 'mongodb+srv://adou4849_db_user:0562abdou@es.vvomd4n.mongodb.net/?appName=Es';
    await mongoose.connect(uri);
    console.log('Connected to DB');

    // 1. Create a test product with variants
    const product = new Product({
      name: 'Test Variant Product',
      price: 100,
      description: 'Test Description',
      category: 'T-Shirts',
      imageUrl: 'http://example.com/main.jpg',
      images: ['http://example.com/1.jpg', 'http://example.com/2.jpg'],
      colors: ['Red', 'Blue'],
      sizes: ['S', 'M', 'L'],
      quantity: 10
    });
    await product.save();
    console.log('✅ Product created with variants');

    // 2. Create a cart and add item with variants
    const cartId = uuidv4();
    const cart = new Cart({ cartId, items: [] });
    await cart.save();

    // Simulate adding to cart via logic (mimicking route logic)
    cart.items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      color: 'Red',
      size: 'M',
      stock: product.quantity
    });
    await cart.save();
    
    const savedCart = await Cart.findOne({ cartId });
    if (savedCart.items[0].color === 'Red' && savedCart.items[0].size === 'M') {
      console.log('✅ Cart item saved with variants');
    } else {
      console.error('❌ Cart item missing variants', savedCart.items[0]);
    }

    // 3. Create an order with variants
    const order = new Order({
      productId: product._id,
      productTitle: product.name,
      customerName: 'Test User',
      customerPhone: '1234567890',
      address: 'Test Address',
      qty: 1,
      color: 'Blue',
      size: 'L'
    });
    await order.save();

    const savedOrder = await Order.findById(order._id);
    if (savedOrder.color === 'Blue' && savedOrder.size === 'L') {
      console.log('✅ Order saved with variants');
    } else {
      console.error('❌ Order missing variants', savedOrder);
    }

    // Cleanup
    await Product.findByIdAndDelete(product._id);
    await Cart.findOneAndDelete({ cartId });
    await Order.findByIdAndDelete(order._id);
    console.log('Cleanup done');

  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

verify();
