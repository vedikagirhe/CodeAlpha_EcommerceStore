# TechNest 🛍️

TechNest is a full-stack e-commerce web application developed as part of the CodeAlpha internship program.

The application allows users to browse technology products, create an account, log in, manage a shopping cart, place orders, track order status, cancel orders, and request product returns.

## Features

### User Features
- User Registration
- Secure Login
- Password Hashing using bcrypt
- Browse Products
- Search Products
- Product Details Page
- Add to Cart
- Quantity Management
- Place Orders
- View Order History
- Track Order Status
- Cancel Orders
- 7-Day Return Policy

### Admin Features
- Secure Admin Login
- Admin Session Protection
- View Customer Orders
- Update Order Status
- Manage Return Requests
- Add Products
- Edit Products
- Delete Products

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- SQLite
- Better SQLite3
- bcrypt.js
- Express Session

## Project Structure

    CodeAlpha_EcommerceStore/
    │
    ├── public/
    │   ├── images/
    │   ├── index.html
    │   ├── login.html
    │   ├── register.html
    │   ├── cart.html
    │   ├── product.html
    │   ├── orders.html
    │   ├── admin-login.html
    │   ├── admin.html
    │   ├── admin-products.html
    │   ├── script.js
    │   └── style.css
    │
    ├── database.js
    ├── server.js
    ├── package.json
    └── README.md

## Installation

1. Clone the repository.

2. Install dependencies:

       npm install

3. Start the server:

       node server.js

4. Open the application in the browser:

       http://localhost:3000

## Return Policy

Customers can request a return only after an order has been delivered.

The return request must be submitted within 7 days from the delivery date.

The administrator can review the return request and update the order status to Returned.

## Security

- User passwords are hashed using bcrypt.
- Admin routes are protected using server-side sessions.
- Admin authentication is required for product and order management.

## Internship

This project was developed as part of the CodeAlpha Web Development Internship.

## Author

Vedika Girhe