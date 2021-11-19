const express = require('express');
const exphbs = require('express-handlebars');

const app = express();
const PORT = process.env.PORT || 3017;
const pg = require("pg");
const Pool = pg.Pool;
const fruitBasketService = require('./fruit-basket-service');

// enable the req.body object - to allow us to use HTML forms
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// enable the static folder...
app.use(express.static('public'));

// add more middleware to allow for templating support
// console.log(exphbs);
const hbs = exphbs.create();
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
let useSSL = false;
let local = process.env.LOCAL || false;
if (process.env.DATABASE_URL && !local) {
    useSSL = true;
}
const dbpool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://codex:pg123@localhost:5432/fruit_basket_app',
    ssl: {
        useSSL,
        rejectUnauthorized: false
    }
});
const fruitBasket = fruitBasketService(dbpool)
let counter = 0;

app.get('/', async function (req, res) {
    const baskets = await fruitBasket.listBaskets()
    res.render('index', {
        baskets
    });
});

app.get('/basket/add', function (req, res) {
    res.render('basket/add');
});

app.get('/basket/edit/:id', async function (req, res) {
    const basketId = req.params.id;
    const basket = await fruitBasket.getBasket(basketId)
    const fruits = await fruitBasket.listFruits()
    const basketItems = await fruitBasket.getBasketItems(basketId)

    res.render('basket/edit', {
        basket,
        fruits,
        basketItems
    });
});
app.post('/basket/update/:id', async function (req, res) {
    const basketId = req.params.id;
    const qty = req.body.qty
    const fruit_id = req.body.fruit_id
    await  fruitBasket.addFruitToBasket(fruit_id, basketId, qty)
    res.redirect(`/basket/edit/${basketId}`)

});
app.post('/basket/add', async function (req, res) {
    await fruitBasket.createBasket(req.body.basket_name)
    res.redirect('/');
})
// app.post('/count', function(req, res) {
// 	counter++;
// 	res.redirect('/')
// });


// start  the server and start listening for HTTP request on the PORT number specified...
app.listen(PORT, function () {
    console.log(`App started on port ${PORT}`)
});