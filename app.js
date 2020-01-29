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
    //console.log(req.params.bookId);
    db.one("SELECT id, title, genre, publisher, year, imageurl FROM books WHERE id = $1;", [req.params.bookId])
    .then(results => {
        res.json(results);
    })
    .catch(error => {
        console.log(error)
        res.end()
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
