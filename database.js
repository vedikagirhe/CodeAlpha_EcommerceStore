const Database = require("better-sqlite3");

const db = new Database("store.db");

// Users Table
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
`).run();

// Orders Table
db.prepare(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        products TEXT NOT NULL,
        total INTEGER NOT NULL,
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// Products Table
db.prepare(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        image TEXT NOT NULL,
        description TEXT NOT NULL
    )
`).run();

const productCount = db.prepare(
    "SELECT COUNT(*) AS count FROM products"
).get();

if (productCount.count === 0) {
    const insertProduct = db.prepare(`
        INSERT INTO products (name, price, image, description)
        VALUES (?, ?, ?, ?)
    `);

    const products = [
        ["Smart Watch", 1999, "images/watch.jpg", "Stylish smart watch with fitness tracking and notifications."],
        ["Headphones", 999, "images/headphones.jpg", "Comfortable headphones with clear and immersive audio."],
        ["Laptop Bag", 799, "images/bag.jpg", "Durable laptop bag for laptops and accessories."],
        ["Mechanical Keyboard", 1499, "images/keyboard.jpg", "Responsive mechanical keyboard for typing and gaming."],
        ["Wireless Mouse", 699, "images/mouse.jpg", "Lightweight wireless mouse with accurate navigation."],
        ["Bluetooth Speaker", 1299, "images/speaker.jpg", "Portable speaker with powerful wireless audio."],
        ["Laptop Stand", 899, "images/laptopstand.jpg", "Ergonomic laptop stand for better posture."],
        ["Power Bank", 1199, "images/powerbank.jpg", "Portable power bank for reliable charging."],
        ["USB-C Hub", 1099, "images/usbhub.jpg", "Multi-port USB-C hub for multiple devices."],
        ["Webcam", 1599, "images/webcam.jpg", "High-quality webcam for meetings and video calls."],
        ["Gaming Mouse Pad", 499, "images/mousepad.jpg", "Smooth mouse pad for accurate mouse movement."],
        ["Wireless Earbuds", 1799, "images/earbuds.jpg", "Compact earbuds with clear wireless audio."]
    ];

    const insertMany = db.transaction((products) => {
        for (const product of products) {
            insertProduct.run(...product);
        }
    });

    insertMany(products);

    console.log("Products added to database!");
}
const orderColumns = db.prepare(
    "PRAGMA table_info(orders)"
).all();

const hasStatus = orderColumns.some(
    column => column.name === "status"
);

if (!hasStatus) {
    db.prepare(`
        ALTER TABLE orders
        ADD COLUMN status TEXT DEFAULT 'Placed'
    `).run();

    console.log("Order status column added!");
}
db.prepare(`
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
`).run();
const orderTableColumns = db.prepare(
    "PRAGMA table_info(orders)"
).all();
const hasPaymentStatus = orderColumns.some(
    column => column.name === "payment_status"
);

if (!hasPaymentStatus) {
    db.prepare(`
        ALTER TABLE orders
        ADD COLUMN payment_status TEXT DEFAULT 'Pending'
    `).run();

    console.log("Payment status column added!");
}

const hasPaymentId = orderColumns.some(
    column => column.name === "payment_id"
);

if (!hasPaymentId) {
    db.prepare(`
        ALTER TABLE orders
        ADD COLUMN payment_id TEXT
    `).run();

    console.log("Payment ID column added!");
}
const hasDeliveredAt = orderTableColumns.some(
    column => column.name === "delivered_at"
);

if (!hasDeliveredAt) {
    db.prepare(`
        ALTER TABLE orders
        ADD COLUMN delivered_at DATETIME
    `).run();

    console.log("Delivered date column added!");
}
module.exports = db;