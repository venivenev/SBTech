var productModel = require('./models/product');
const orderModel = require('./models/order');
const express = require('express');
const app = express();
var jwt = require('jsonwebtoken');
var config = require('./config');
var utils = require('./utils/utils');
const await  = require("await");
const async  = require("async");

var AuthController = require('./auth/AuthController');

app.use('/', AuthController);

app.get('/products', async (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.secret, async function(err, decoded) {
    res.send(await utils.renderProducts(decoded.country));
    });
});

app.post('/product/add', (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    const { name, category, price} = req.body;
    const newProduct = { name: name, category, price };
    let status = 200;
    productModel.insert(newProduct)
        .then(() => {
            res.status(status).end();
        }).catch(err => {
            res.status(400).send(err.errors);
        });
    });
});

app.post('/product/edit', (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    const {id, name, category, price} = req.body;
    const updatedProduct = {id: +id, name: name, category: category, price: price};
    let action;
    let status = 200;
    if (updatedProduct.id === -1) {
        status = 201;
        action = productModel.insert(updatedProduct);
    } else {
        action = productModel.update(updatedProduct);
    }

    action.then(() => {
        res.status(status).end();
    }).catch(err => {
        res.status(400).send(err.errors);
    });
    });
});

app.post('/product/delete', (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        const id = req.body.id;
        let status = 200;
        productModel.remove(id)
            .then(() => {
                res.status(status).end();
            }).catch(err => {
            res.status(400).send(err.errors);
        });
    });
});

app.get('/orders', function(req, res) {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        const entities = orderModel.getEntities();
        res.status(200).send(entities);
    });
});

app.post('/order/add', (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        const {products, status, date = ''} = req.body;
        var dateString = utils.buildTodaysDateString();
        var productsList = JSON.parse(products);
        const newOrder = { date:dateString, products:productsList, status:status };
        let statusReturned = 200;
        orderModel.insert(newOrder)//
            .then(() => {
                res.status(statusReturned).end();
            }).catch(err => {
            res.status(400).send(err.errors);
        });
    });
});

app.post('/product/update-order-status', (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
       
        var dateString = utils.buildTodaysDateString();
        const id = +req.body.id;
        let status = req.body.status;
        const orders = orderModel.getEntities();
        const order = orders.filter(order => order.id === id);
        const productsList = order[0].products;
        const updatedOrder = { id:id, date:dateString, products:productsList, status:status };
        
        let action;
        let responseStatus = 200;
        if (updatedOrder.id === -1) {
            status = 201;
            action = orderModel.insert(updatedOrder);
        } else {
            action = orderModel.update(updatedOrder);
        }

        action.then(() => {
            res.status(responseStatus).end();
        }).catch(err => {
            res.status(400).send(err.errors);
        });
    });
});

app.listen(config.port, () => console.log('App listening on port '+ config.port+'!'));