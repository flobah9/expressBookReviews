const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');

// Register a new user
public_users.post("/register", (req,res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  // Check if the username already exists
  if (users[username]) {
    return res.status(400).json({ message: "Username already exists." });
  }
  // Add the user to the database
  users[username] = password;
  return res.status(200).json({ message: "User registered successfully." });
});

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  try {
    const response = await axios.get('./booksdb.js');
    const books = response.data;
    return res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    return res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    const response = await axios.get(`./booksdb.js?isbn=${req.params.isbn}`);
    
    if (!response.data) {
      return res.status(404).json({ message: "Book not found." });
    }
    
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  try {
    const response = await axios.get(`./booksdb.js?author=${req.params.author}`);
    
    if (!response.data || response.data.length === 0) {
      return res.status(404).json({ message: "Books by this author not found." });
    }
    
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  try {
    const response = await axios.get(`./booksdb.js?title=${req.params.title}`);
    
    if (!response.data || response.data.length === 0) {
      return res.status(404).json({ message: "Books with this title not found." });
    }
    
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books.find(book => book.isbn === isbn);
  if (!book) {
    return res.status(404).json({ message: "Book not found." });
  }
  if (!book.review) {
    return res.status(404).json({ message: "Review not found for this book." });
  }
  return res.status(200).json({ review: book.review });
});

module.exports.general = public_users;
