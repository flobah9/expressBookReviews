const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [
    {id: 1, username: "flobert", password: "pawword!"}
];

const isValid = (username) => {
  // Check if the username is not empty
  if (!username) {
      return false;
  }

  // Check if the username is between 4 and 20 characters long
  if (username.length < 4 || username.length > 20) {
      return false;
  }

  // // Check if the username contains only alphanumeric characters and underscores
  // if (!/^[a-zA-Z0-9_]+$/.test(username)) {
  //     return false;
  // }

  // Username is valid if it passes all checks
  return true;
};


const authenticatedUser = (username, password) => {
  // Find the user with the provided username
  const user = users.find(user => user.username === username);

  // If user not found or password doesn't match, return false
  if (!user || user.password !== password) {
      return false;
  }

  // If username and password match, return true
  return true;
};


//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body;

    // Check if username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Check if the username is valid
    // if (!isValid(username)) {
    //     return res.status(400).json({ message: "Invalid username" });
    // }

    // // Check if the user is authenticated
    // if (!authenticatedUser(username, password)) {
    //     return res.status(401).json({ message: "Invalid username or password" });
    // }

    // Generate a JWT token
    const token = jwt.sign({ username }, 'jwtsecret', { expiresIn: '1h' });

    res.status(200).json({ message: "Login successful", token });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const { isbn } = req.params;
    const { rating, comment } = req.body;
    const token = req.headers.authorization;

    // Verify JWT token
    jwt.verify(token, 'jwtsecret', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Assuming user is authenticated, you can access username from decoded token
        const username = decoded.username;

        // Find the book by ISBN
        const book = books.find(b => b.isbn === isbn);

        // Check if the book exists
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Add the review to the book's reviews array
        book.reviews.push({ username, rating, comment });

        // Return success message
        res.status(201).json({ message: "Review added successfully", review: { username, rating, comment } });
    });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const bookIndex = books.findIndex(book => book.isbn === isbn);

  if (bookIndex === -1) {
    return res.status(404).json({ message: "Book not found." });
  }

  // Check if the book has a review
  if (!books[bookIndex].review || Object.keys(books[bookIndex].review).length === 0) {
    return res.status(404).json({ message: "Review not found for this book." });
  }

  // Delete the review
  delete books[bookIndex].review;

  return res.status(200).json({ message: "Review deleted successfully." });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
