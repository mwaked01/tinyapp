const express = require("express");
let cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Data base that contains registered user info.
const users = {
  user1: {
    id: "user1",
    email: "user1@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2: {
    id: "user2",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const generateRandomString = function() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const userLookup = function(email) {
  for (let id in users) {
    //check if given email exists in the users database
    if (users[id].email === email) {
      return users[id];
    }
  }
  return null;
};

app.get("/", (req, res) => {
  //whenever the the user_id cookie is not empty, a user is logged in
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//logic to check if user is logged in is in urls_index.ejs
app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  if (req.cookies.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  //Redirects to teh actual website that the short url represents
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  //remove specified content from URL Database when delete is clicked
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  const emailCheck = userLookup(req.body.email);
  //When email is not found in userLookup, emailCheck will have a null value
  if (emailCheck) {
    //Email is found in user database
    if (emailCheck.password === req.body.password) {
      res.cookie(`user_id`, emailCheck.id);
      res.redirect('/urls');
    } else {
      //Email is in user database but the Password doesnt match up
      res.status(403);
      res.sendStatus(403);
    }
  } else {
    //Email is not found in user Database
    res.status(403);
    res.sendStatus(403);
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/login`);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render('register', templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email.trim().length === 0 || req.body.password.trim().length === 0) {
    //Email and Password have empty inputs or blank spaces
    res.status(400);
    res.sendStatus(400);
  } else if (userLookup(req.body.email) === null) {
    //Email is valid and doesn't already exist in database
    let userId = generateRandomString();
    users[userId] = { id: userId, email: req.body.email, password: req.body.password };
    res.cookie(`user_id`, userId);
    res.redirect('/urls');
  } else {
    //Email already exists in database
    res.status(400);
    res.sendStatus(400);
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render('login', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});