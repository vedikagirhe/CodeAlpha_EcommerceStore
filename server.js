require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const db = require("./database");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const app = express();
const PORT = 3000;

// ================= MIDDLEWARE =================

app.use(express.json());

app.use(session({
    secret: "technest-admin-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax"
    }
}));

app.use(express.static("public"));

// ================= ADMIN PROTECTION =================

function requireAdmin(req, res, next) {
    if (req.session.adminLoggedIn) {
        return next();
    }

    return res.status(401).json({
        success: false,
        message: "Admin login required!"
    });
}

// ================= USER REGISTER =================

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.prepare(`
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `).run(name, email, hashedPassword);

        res.json({
            success: true,
            message: "Registration successful!"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Email already registered!"
        });
    }
});

// ================= USER LOGIN =================

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = db.prepare(`
        SELECT * FROM users
        WHERE email = ?
    `).get(email);

    if (!user) {
        return res.status(400).json({
            success: false,
            message: "User not found!"
        });
    }

    const validPassword = await bcrypt.compare(
        password,
        user.password
    );

    if (!validPassword) {
        return res.status(400).json({
            success: false,
            message: "Incorrect password!"
        });
    }

    res.json({
        success: true,
        message: "Login successful!",
        name: user.name
    });
});

// ================= PRODUCTS =================

app.get("/products", (req, res) => {
    try {
        const products = db.prepare(`
            SELECT * FROM products
        `).all();

        res.json(products);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not load products!"
        });
    }
});

app.get("/products/:id", (req, res) => {
    try {
        const product = db.prepare(`
            SELECT * FROM products
            WHERE id = ?
        `).get(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found!"
            });
        }

        res.json(product);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not load product!"
        });
    }
});

// ================= PLACE ORDER =================

app.post("/order", (req, res) => {
    const { customerName, products, total } = req.body;

    try {
        const result = db.prepare(`
            INSERT INTO orders (
                customer_name,
                products,
                total
            )
            VALUES (?, ?, ?)
        `).run(
            customerName,
            JSON.stringify(products),
            total
        );

        res.json({
            success: true,
            message: "Order placed successfully!",
            orderId: result.lastInsertRowid
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Order could not be placed!"
        });
    }
});

// ================= CUSTOMER ORDERS =================

app.get("/orders/:customerName", (req, res) => {
    try {
        const orders = db.prepare(`
            SELECT * FROM orders
            WHERE customer_name = ?
            ORDER BY order_date DESC
        `).all(req.params.customerName);

        const formattedOrders = orders.map(order => ({
            ...order,
            products: JSON.parse(order.products)
        }));

        res.json(formattedOrders);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not load orders!"
        });
    }
});

// ================= CANCEL ORDER =================

app.put("/orders/:id/cancel", (req, res) => {
    try {
        let result;

if (status === "Delivered") {
    result = db.prepare(`
        UPDATE orders
        SET status = ?,
            delivered_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(status, req.params.id);
} else {
    result = db.prepare(`
        UPDATE orders
        SET status = ?
        WHERE id = ?
    `).run(status, req.params.id);
}

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found!"
            });
        }

        res.json({
            success: true,
            message: "Order cancelled successfully!"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not cancel order!"
        });
    }
});

// ================= CREATE ADMIN =================

app.post("/admin/create", async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        db.prepare(`
            INSERT INTO admins (username, password)
            VALUES (?, ?)
        `).run(username, hashedPassword);

        res.json({
            success: true,
            message: "Admin created successfully!"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Admin already exists!"
        });
    }
});

// ================= ADMIN LOGIN =================

app.post("/admin/login", async (req, res) => {
    const { username, password } = req.body;

    const admin = db.prepare(`
        SELECT * FROM admins
        WHERE username = ?
    `).get(username);

    if (!admin) {
        return res.status(400).json({
            success: false,
            message: "Admin not found!"
        });
    }

    const validPassword = await bcrypt.compare(
        password,
        admin.password
    );

    if (!validPassword) {
        return res.status(400).json({
            success: false,
            message: "Incorrect password!"
        });
    }

    req.session.adminLoggedIn = true;
    req.session.adminUsername = admin.username;

    res.json({
        success: true,
        message: "Admin login successful!"
    });
});

// ================= ADMIN LOGOUT =================

app.post("/admin/logout", (req, res) => {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Admin logout failed!"
            });
        }

        res.json({
            success: true,
            message: "Admin logged out successfully!"
        });
    });
});

// ================= ADMIN ORDERS =================

app.get("/admin/orders", requireAdmin, (req, res) => {
    try {
        const orders = db.prepare(`
            SELECT * FROM orders
            ORDER BY order_date DESC
        `).all();

        const getProduct = db.prepare(`
            SELECT image, description
            FROM products
            WHERE name = ?
        `);

        const formattedOrders = orders.map(order => {
            const orderProducts = JSON.parse(order.products);

            const productsWithDetails = orderProducts.map(product => {
                const productDetails = getProduct.get(product.name);

                return {
                    ...product,
                    image: productDetails?.image || "",
                    description:
                        productDetails?.description ||
                        "Product details"
                };
            });

            return {
                ...order,
                products: productsWithDetails
            };
        });

        res.json(formattedOrders);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Could not load admin orders!"
        });
    }
});
// ================= UPDATE ORDER STATUS =================

app.put(
    "/admin/orders/:id/status",
    requireAdmin,
    (req, res) => {

        const { status } = req.body;

       const allowedStatuses = [
    "Placed",
    "Processing",
    "Delivered",
    "Cancelled",
    "Return Requested",
    "Returned"
];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status!"
            });
        }

        try {
            const result = db.prepare(`
                UPDATE orders
                SET status = ?
                WHERE id = ?
            `).run(status, req.params.id);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found!"
                });
            }

            res.json({
                success: true,
                message: "Order status updated successfully!"
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Could not update order status!"
            });
        }
    }
);

// ================= ADD PRODUCT =================

app.post(
    "/admin/products",
    requireAdmin,
    (req, res) => {

        const {
            name,
            price,
            image,
            description
        } = req.body;

        try {
            const result = db.prepare(`
                INSERT INTO products (
                    name,
                    price,
                    image,
                    description
                )
                VALUES (?, ?, ?, ?)
            `).run(
                name,
                price,
                image,
                description
            );

            res.json({
                success: true,
                message: "Product added successfully!",
                productId: result.lastInsertRowid
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Could not add product!"
            });
        }
    }
);

// ================= UPDATE PRODUCT =================

app.put(
    "/admin/products/:id",
    requireAdmin,
    (req, res) => {

        const {
            name,
            price,
            image,
            description
        } = req.body;

        try {
            const result = db.prepare(`
                UPDATE products
                SET name = ?,
                    price = ?,
                    image = ?,
                    description = ?
                WHERE id = ?
            `).run(
                name,
                price,
                image,
                description,
                req.params.id
            );

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found!"
                });
            }

            res.json({
                success: true,
                message: "Product updated successfully!"
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Could not update product!"
            });
        }
    }
);

// ================= DELETE PRODUCT =================

app.delete(
    "/admin/products/:id",
    requireAdmin,
    (req, res) => {

        try {
            const result = db.prepare(`
                DELETE FROM products
                WHERE id = ?
            `).run(req.params.id);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found!"
                });
            }

            res.json({
                success: true,
                message: "Product deleted successfully!"
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Could not delete product!"
            });
        }
    }
);

// ================= START SERVER =================
app.put("/orders/:id/return", (req, res) => {
    try {
        const order = db.prepare(`
            SELECT * FROM orders
            WHERE id = ?
        `).get(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found!"
            });
        }

        if (order.status !== "Delivered") {
            return res.status(400).json({
                success: false,
                message: "Only delivered orders can be returned!"
            });
        }

        if (!order.delivered_at) {
            return res.status(400).json({
                success: false,
                message: "Delivery date not found!"
            });
        }

        const deliveredDate = new Date(
            order.delivered_at + " UTC"
        );

        const currentDate = new Date();

        const differenceInDays =
            (currentDate - deliveredDate) /
            (1000 * 60 * 60 * 24);

        if (differenceInDays > 7) {
            return res.status(400).json({
                success: false,
                message: "7-day return period has expired!"
            });
        }

        db.prepare(`
            UPDATE orders
            SET status = 'Return Requested'
            WHERE id = ?
        `).run(req.params.id);

        res.json({
            success: true,
            message: "Return request submitted successfully!"
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Could not request return!"
        });
    }
});
// ================= CREATE RAZORPAY ORDER =================

app.post("/create-payment-order", async (req, res) => {
    const { total } = req.body;

    try {
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(Number(total) * 100),
            currency: "INR",
            receipt: "receipt_" + Date.now()
        });

        res.json({
            success: true,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Could not create payment order!"
        });
    }
});
// ================= VERIFY RAZORPAY PAYMENT =================

app.post("/verify-payment", (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            customerName,
            products,
            total
        } = req.body;

        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                razorpay_order_id + "|" + razorpay_payment_id
            )
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed!"
            });
        }

        const insertOrder = db.prepare(`
    INSERT INTO orders (
        customer_name,
        products,
        total,
        payment_status,
        payment_id
    )
    VALUES (?, ?, ?, ?, ?)
`);

const result = insertOrder.run(
    customerName,
    JSON.stringify(products),
    total,
    "Paid",
    razorpay_payment_id
);

        res.json({
            success: true,
            message: "Payment successful! Order placed.",
            orderId: result.lastInsertRowid
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Could not verify payment!"
        });
    }
});
app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});