const express = require("express");
const cors = require("cors");

require("dotenv").config();

const PORT = process.env.PORT || 8080;
const DATABASE_URL = process.env.DATABASE_URL;

const app = express();

const pgp = require("pg-promise")();
pgp.pg.defaults.ssl = true;
const db = pgp(DATABASE_URL);

app.use(cors());
app.use(express.json());

// root route - returns all the books
app.get("/", (req, res) => {
    db.any("SELECT id, title, genre, publisher, year, imageurl FROM books ORDER BY id;")
    .then(results => {
        res.json(results);
    })
    .catch(error => {
        console.log(error)
        res.end()
    });
});

// detail route - return one book
app.get("/detail/:bookId", (req, res) => {
    db.one("SELECT id, title, genre, publisher, year, imageurl FROM books WHERE id = $1;", [req.params.bookId])
    .then(results => {
        res.json(results);
    })
    .catch(error => {
        console.log(error)
        res.end()
    });
});

// delete route - delete a book
app.post("/delete", (req,res) => {
    db.none("DELETE FROM books WHERE id = $1", [req.body.book])
    res.end();
})

// insert/update route - add a new book or edit an existing book
app.post("/edit/:bookId", (req,res) => {
    if (req.params.bookId==0) {
        // this is an INSERT request
        db.none("INSERT INTO books (title, genre, publisher, year, imageurl) VALUES ($1, $2, $3, $4, $5);", [req.body.book.title, req.body.book.genre, req.body.book.publisher, req.body.book.year, req.body.book.imageurl])
        res.end();
    }
    else
    {
        // this is an UPDATE request
        db.none("UPDATE books SET title=$1, genre=$2, publisher=$3, year=$4, imageurl=$5 WHERE id=$6;", [req.body.book.title, req.body.book.genre, req.body.book.publisher, req.body.book.year, req.body.book.imageurl, req.params.bookId])
        res.end();
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
