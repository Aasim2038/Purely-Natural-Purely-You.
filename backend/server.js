require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// CORS Configuration
const whitelist = [
  'https://softstich.com', 
  'https://www.softstich.com', 
  'http://127.0.0.1:3000', // Yeh zaroori hai local testing ke liye
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // !origin check karta hai agar request mobile app ya postman se aa rahi ho
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("CORS Blocked for origin:", origin); // Logs mein origin dikhayega
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('SUCCESS: Connected to MongoDB Atlas'))
  .catch((err) => console.error('ERROR: Could not connect to MongoDB Atlas', err));

  // --- SCHEMAS ---

// NAYA COUNTER SCHEMA (Order ID ke liye)
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 1000 }
});
const Counter = mongoose.model('Counter', counterSchema);

// --- PRODUCT SCHEMA ---
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: String,
  price: String,
  img: String,
  img_public_id: String,
  category: { type: String, required: true }
});
const Product = mongoose.model('Product', productSchema);

// --- ORDER SCHEMA (Database mein Order kaisa dikhega) ---
const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  customerName: String,
  customerPhone: String,
  customerAddress: String,
  orderItems: Array,
  totalAmount: Number,
  location: { // YEH NAYA FIELD HAI
    latitude: String,
    longitude: String
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
});
const Order = mongoose.model('Order', orderSchema);

// --- HELPER FUNCTION (Nayi Order ID banane ke liye) ---
async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true } // Agar 'orderCounter' nahi hai toh bana dega
  );
  return sequenceDocument.sequence_value;
}

// --- CLOUDINARY & MULTER CONFIG ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'purevia-products',
        allowedFormats: ['jpeg', 'png', 'jpg'],
    },
});
const upload = multer({ storage: storage });

// --- AUTHENTICATION ---
const ADMIN_PASSWORD = "Aurangabad";
const checkAuth = (req, res, next) => {
  let password;
  if (req.method === 'POST' || req.method === 'PUT') {
    password = req.body.password;
  } else {
    password = req.headers.authorization;
  }
  if (password === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized: Wrong Password" });
  }
};

// --- API ROUTES ---

// Public routes
app.get('/api/public/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// server.js mein
// ... (aapke purane public routes ke neeche)

// NAYA PUBLIC ROUTE: Ek single product ko uski ID se laane ke liye
app.get('/api/public/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Cannot find product' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NAYA ROUTE: Saari unique categories laane ke liye
app.get('/api/public/categories', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json(categories);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// NAYA ROUTE: Ek specific category ke saare products laane ke liye
app.get('/api/public/products/category/:categoryName', async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.categoryName });
        res.json(products);
    } catch (err) { 
      console.error("!!! ERROR: CATEGORY ROUTE CRASHED !!!", err);
      res.status(500).json({ message: err.message }); }
});


// Admin routes
app.get('/api/products', checkAuth, async (req, res) => {
    try {
      const products = await Product.find();
      res.json(products);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/products/:id', checkAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Cannot find product' });
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/products', upload.single('img'), checkAuth, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Image file is required" });
  const product = new Product({
    name: req.body.name,
    desc: req.body.desc,
    price: req.body.price,
    category: req.body.category, // Category save karein
    img: req.file.path,
    img_public_id: req.file.filename
  });
  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/products/:id', upload.single('img'), checkAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Cannot find product' });

    product.name = req.body.name || product.name;
    product.desc = req.body.desc || product.desc;
    product.price = req.body.price || product.price;
    product.category = req.body.category || product.category; // Category update karein

    if (req.file) {
      if (product.img_public_id) {
        await cloudinary.uploader.destroy(product.img_public_id);
      }
      product.img = req.file.path;
      product.img_public_id = req.file.filename;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/products/:id', checkAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Cannot find product' });
    if (product.img_public_id) {
        await cloudinary.uploader.destroy(product.img_public_id);
    }
    await product.deleteOne();
    res.json({ message: 'Deleted Product' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// NAYA ROUTE: Naya order banane ke liye
app.post('/api/orders', async (req, res) => {
  try {
    const nextOrderId = await getNextSequenceValue('orderCounter');

    const order = new Order({
      orderId: `ORD-${nextOrderId}`,
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      customerAddress: req.body.customerAddress,
      orderItems: req.body.orderItems,
      totalAmount: req.body.totalAmount,
      location: req.body.location // Nayi location save karein
    });
    
    const newOrder = await order.save();
    res.status(201).json({ success: true, orderId: newOrder.orderId });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// server.js mein, baaki admin routes ke saath...

// NAYA ADMIN ROUTE: Saare orders laane ke liye
app.get('/api/orders', checkAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderDate: -1 }); // Naye order sabse upar
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/orders/:id', checkAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order == null) {
      return res.status(404).json({ message: 'Cannot find order' });
    }
    await order.deleteOne();
    res.json({ message: 'Deleted Order' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// STATIC FILE SERVING
app.use('/', express.static(path.join(__dirname, '../public_html')));

// SERVER START
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});