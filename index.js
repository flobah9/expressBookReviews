const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware part
app.use(bodyParser.json());
app.use(session({
  secret: 'flobert',
  resave: false,
  saveUninitialized: false
}));

// users 
const users = [
  { id: 1, username: 'flobert', password: 'password1' },
  { id: 2, username: 'munobvaneyi', password: 'password2' }
];

// book data
const books = require('./books.json');

// Authentication middleware using session
const authenticateSession = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Authentication middleware using JWT
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, 'jwtsecret', (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Routes
app.get('/books', (req, res) => {
  res.json(books);
});

app.get('/books/:isbn', (req, res) => {
  const book = books.find(b => b.isbn === req.params.isbn);
  if (book) {
    res.json(book);
  } else {
    res.status(404).json({ message: 'Book not found' });
  }
});

app.get('/books/:isbn/reviews', (req, res) => {
    const isbn = req.params.isbn;
    const book = books.find(b => b.isbn === isbn);
  
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
  
    // Assuming each book has a 'reviews' property containing an array of reviews
    const reviews = book.reviews;
  
    res.json({ reviews });
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
  
    // Check if username or password is missing
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
  
    // Check if username already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }
  
    // Create a new user object
    const newUser = {
      id: users.length + 1,
      username,
      password
    };
  
    // Add the new user to the users array (in a real application, you would store this information securely)
    users.push(newUser);
  
    // Return a success message
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  });
  

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check if username or password is missing
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
  
    // Find the user with the provided username
    const user = users.find(user => user.username === username);
  
    // Check if the user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (password !== user.password) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
    else {
        // Generate a session or JWT token
      req.session.user = {
        id: user.id,
        username: user.username
      };
  
      // Alternatively, generate a JWT token
      // const token = jwt.sign({ id: user.id, username: user.username }, 'jwtsecret', { expiresIn: '1h' });
  
      res.status(200).json({ message: 'Login successful', user: req.session.user });
    }

});

app.post('/books/:isbn/reviews', authenticateJWT, (req, res) => {
    const { isbn } = req.params;
    const { rating, comment } = req.body;
  
    // Find the book by ISBN
    const book = books.find(b => b.isbn === isbn);
  
    // Check if the book exists
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
  
    // Create a new review object
    const newReview = {
      userId: req.user.id, // Assuming user ID is stored in req.user
      rating,
      comment,
      createdAt: new Date()
    };
  
    // Add the new review to the book's reviews array
    book.reviews.push(newReview);
  
    // Return a success message
    res.status(201).json({ message: 'Review added successfully', review: newReview });
});
  

app.put('/books/:isbn/reviews/:reviewId', authenticateJWT, (req, res) => {
    const { isbn, reviewId } = req.params;
    const { rating, comment } = req.body;
  
    // Find the book by ISBN
    const book = books.find(b => b.isbn === isbn);
  
    // Check if the book exists
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
  
    // Find the review by ID
    const reviewIndex = book.reviews.findIndex(review => review.id === parseInt(reviewId));
  
    // Check if the review exists
    if (reviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found' });
    }
  
    // Check if the user owns the review
    if (book.reviews[reviewIndex].userId !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to modify this review' });
    }
  
    // Modify the review
    book.reviews[reviewIndex] = {
      ...book.reviews[reviewIndex],
      rating: rating || book.reviews[reviewIndex].rating,
      comment: comment || book.reviews[reviewIndex].comment
    };
  
    // Return a success message
    res.json({ message: 'Review modified successfully', review: book.reviews[reviewIndex] });
});
  

app.delete('/books/:isbn/reviews/:reviewId', authenticateJWT, (req, res) => {
    const { isbn, reviewId } = req.params;
  
    // Find the book by ISBN
    const book = books.find(b => b.isbn === isbn);
  
    // Check if the book exists
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
  
    // Find the review by ID
    const reviewIndex = book.reviews.findIndex(review => review.id === parseInt(reviewId));
  
    // Check if the review exists
    if (reviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found' });
    }
  
    // Check if the user owns the review
    if (book.reviews[reviewIndex].userId !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this review' });
    }
  
    // Delete the review
    book.reviews.splice(reviewIndex, 1);
  
    // Return a success message
    res.json({ message: 'Review deleted successfully' });
});
  

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
