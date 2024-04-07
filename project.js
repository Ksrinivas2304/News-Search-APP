const express = require('express');
const app = express();
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const axios = require('axios');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./key.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const port = 4000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.set('view engine', 'ejs');

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}


async function isEmailUnique(email) {
  const querySnapshot = await db.collection('users')
    .where('email', '==', email)
    .get();
  return querySnapshot.empty;
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/home.html');
});

app.get('/feedback', (req, res) => {
  res.sendFile(__dirname + '/feedback.html');
});

app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/signup.html');
});

app.post('/signupsubmit', async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  if (!username || !email || !password) {
    res.send('All fields are required for signup.');
    return;
  }
  const isUnique = await isEmailUnique(email);

  if (!isUnique) {
    return res.send('Email address is already in use. Please choose another email.');
  }


  const hashedPassword = await hashPassword(password);

  
  db.collection('users').add({
    username,
    email,
    password: hashedPassword,
  });

  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});


app.post('/loginsubmit', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const querySnapshot = await db.collection('users')
    .where('username', '==', username)
    .get();

  if (querySnapshot.empty) {
    return res.send('Invalid credentials');
  }

  const userDoc = querySnapshot.docs[0];
  const storedHashedPassword = userDoc.data().password;

  bcrypt.compare(password, storedHashedPassword, (compareError, result) => {
    if (compareError) {
      console.error('Error comparing passwords:', compareError);
      res.send('Invalid credentials');
    } else if (result) {
      
      res.redirect('/news');
    } else {
    
      res.send('Invalid credentials');
    }
  });
});
const apiKey = '20168a837f37cdb6a952f0a19881d76a';
app.get('/news', (req, res) => {
  res.render('news', { pageTitle: 'News Search', articles: {} });
});

app.post('/search', async (req, res) => {
  try {
    const searchQuery = req.body.searchQuery;
    const apiUrl = `https://gnews.io/api/v4/search?lang=en&country=in&q=${searchQuery}&apikey=${apiKey}`;
    const response = await axios.get(apiUrl);
    const articles = response.data.articles;
    const groupedArticles = {
      c1: articles.slice(0, 1),
      c2: articles.slice(1, 2),
      c3: articles.slice(2, 3)
    };

    res.render('news', { pageTitle: 'News Search', articles: groupedArticles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.render('news', { pageTitle: 'News Search', articles: {} });
  }
});

app.get('/logout', (req, res) => {
  res.redirect('/');
});

app.get('/homee', (req, res) => {
  res.redirect('/');
});

app.get('/hlogin', (req, res) => {
  res.redirect('/login');
});

app.get('/hsignup', (req, res) => {
  res.redirect('/signup');
});

app.get('/feedback', (req, res) => {
  res.redirect('/feedback');
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



