const express = require("express");
let cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "user1",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user1",
  },
};

const urlsForUser = function (id) {
  let validURLs = {};
  for (let data in urlDatabase) {
    if (urlDatabase[data].userID === id) {
      validURLs[data] = urlDatabase[data].longURL;
    }
  }
  return validURLs;
}

//Data base that contains registered user info.
const users = {
  user1: {
    id: "user1",
    email: "user1@example.com",
    password: "new",
  },
  user2: {
    id: "user2",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const generateRandomString = function () {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const userLookup = function (email) {
  for (let id in users) {
    //check if given email exists in the users database
    if (users[id].email === email) {
      return users[id];
    }
  }
  return null;
};

app.get("/", (req, res) => {
  //whenever the user_id cookie is not empty, a user is logged in
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  //in the case that there is a cookie on the website but it doesnt match the database
  if (!users[req.cookies.user_id]) {
    res.clearCookie('user_id');
  }

  const filteredURL = urlsForUser(req.cookies.user_id);

  const templateVars = {
    user: users[req.cookies.user_id],
    urls: filteredURL
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
  if (urlDatabase[req.params.id].userID === req.cookies.user_id) {
    const templateVars = { user: users[req.cookies.user_id], id: req.params.id, longURL: urlDatabase[req.params.id]['longURL'] };
    res.render("urls_show", templateVars);
  } else {
    res.send("Please login first!");
  }
});

app.post("/urls", (req, res) => {
  if (req.cookies.user_id) {
    let id = generateRandomString();
    urlDatabase[id] = { longURL: req.body.longURL, userID: req.cookies.user_id };
    res.redirect(`/urls/${id}`);
  } else {
    res.send("Please login first!");
  }
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(404).send(`'${req.params.id}' does not exist in the data base. Check /urls for refrence.`);
  } else {
    const longURL = urlDatabase[req.params.id]['longURL'];
    //Redirects to the actual website that the short url represents
    res.redirect(longURL);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  //remove specified content from URL Database when delete is clicked
  if (urlDatabase[req.params.id]) {
    if (req.cookies.user_id) {
      if (urlDatabase[req.params.id].userID === req.cookies.user_id) {
        delete urlDatabase[req.params.id];
        res.redirect(`/urls`);
      } else {
        res.send("URL does not exist on this account!");
      }
    } else {
      res.send("Please login first!");
    }
  } else {
    res.send("Short URL ID does not exist.");
  }
});

app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    if (req.cookies.user_id) {
      if (urlDatabase[req.params.id].userID === req.cookies.user_id) {
        urlDatabase[req.params.id]['longURL'] = req.body.longURL;
        res.redirect(`/urls`);
      } else {
        res.send("URL does not exist on this account!");
      }
    } else {
      res.send("Please login first!");
    }

  } else {
    res.send("Short URL ID does not exist.");
  }
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
      res.status(403).send('Invalid credentials!');
    }
  } else {
    //Email is not found in user Database
    res.status(403).send('Invalid credentials!');
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/login`);
});

app.get("/register", (req, res) => {
  if (!req.cookies.user_id) {
    const templateVars = { user: users[req.cookies.user_id] };
    res.render('register', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.post("/register", (req, res) => {
  if (req.body.email.trim().length === 0 || req.body.password.trim().length === 0) {
    //Email and Password have empty inputs or blank spaces
    res.status(400).send('Email and Password cannot contain empty spaces.');
  } else if (userLookup(req.body.email) === null) {
    //Email is valid and doesn't already exist in database
    let userId = generateRandomString();
    users[userId] = { id: userId, email: req.body.email, password: req.body.password };
    res.cookie(`user_id`, userId);
    res.redirect('/urls');
  } else {
    //Email already exists in database
    res.status(400).send('An account already exists with this email.');
  }
});

app.get("/login", (req, res) => {
  if (!req.cookies.user_id) {
    const templateVars = { user: users[req.cookies.user_id] };
    res.render('login', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});