const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const PORT = process.env.PORT || 8080;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();

const pgp = require("pg-promise")();
pgp.pg.defaults.ssl = true;
const db = pgp(DATABASE_URL);

app.use(cors());
app.use(express.json());

const authenticate = (req, res, next) => {
    // protects all routes other than login and register
    let token = req.headers['authorization']
    if (!token || token=='null') {
        console.log('No token.')
        res.status(401).json({
            success: false,
            message: 'Please log in to access site.'
          });
    } else {
        jwt.verify(token, JWT_SECRET, (err,user) => {
            if (err) {
                console.log(err)
                res.status(401).json({
                    success: false,
                    message: 'Please log in to access site.'
                  });
            } else {
                req.username = user.name;
                next();
            }
        });
    }
}

// root route - user login
app.post("/", (req,res) => {
    // expects a user object { name: "username", password: "password" } in the body
    const u = { name: req.body.name }
    const token = jwt.sign(u, process.env.JWT_SECRET, {
        expiresIn: 60 * 60 * 24 // expires in 24 hours
     });
    // send back a token
    res.json(token);
})

// register route - register a new user
app.post("/register", (req,res) => {
    // expects a user object { name: "username", password: "password" } in the body
    const u = { name: req.body.name }
    const token = jwt.sign(u, process.env.JWT_SECRET, {
        expiresIn: 60 * 60 * 24 // expires in 24 hours
     });
    // send back a token
    res.json(token);
})

// books route - returns all the books
app.get("/books", authenticate, (req, res) => {
    db.any("SELECT id, title, genre, publisher, year, imageurl FROM books ORDER BY id;")
    .then(results => {
        res.json(results);
    })
    .catch(error => {
        console.log(error)
        res.status(500).send();
    });
});

// detail route - return one book (by id)
app.get("/detail/:bookId", authenticate, (req, res) => {
    db.one("SELECT id, title, genre, publisher, year, imageurl FROM books WHERE id = $1;", [req.params.bookId])
    .then(results => {
        res.json(results);
    })
    .catch(error => {
        console.log(error)
        res.status(500).send();
    });
});

// delete route - delete a book (by id)
app.post("/delete", authenticate, (req,res) => {
    // TODO: can any user delete any book?
    db.none("DELETE FROM books WHERE id = $1", [req.body.book])
    .then(() => {
        res.status(200).send();
    })
    .catch(error => {
        console.log(error)
        res.status(500).send();
    });
})

// edit route - add a new book or edit an existing book (id = 0 add; any other id update)
app.post("/edit/:bookId", authenticate, (req,res) => {
    if (req.params.bookId==0) {
        // this is an INSERT request
        db.none("INSERT INTO books (title, genre, publisher, year, imageurl) VALUES ($1, $2, $3, $4, $5);", [req.body.book.title, req.body.book.genre, req.body.book.publisher, req.body.book.year, req.body.book.imageurl])
        .then(() => {
            res.status(200).send();
        })
        .catch(error => {
            console.log(error)
            res.status(500).send();
        });
    }
    else
    {
        // this is an UPDATE request
        db.none("UPDATE books SET title=$1, genre=$2, publisher=$3, year=$4, imageurl=$5 WHERE id=$6;", [req.body.book.title, req.body.book.genre, req.body.book.publisher, req.body.book.year, req.body.book.imageurl, req.params.bookId])
        .then(() => {
            res.status(200).send();
        })
        .catch(error => {
            console.log(error)
            res.status(500).send();
        });
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
