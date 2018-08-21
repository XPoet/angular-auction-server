"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var ws_1 = require("ws");
var path = require("path");
var app = express();
app.use('/', express.static(path.join(__dirname, '..', 'client')));
app.get('/', function (req, res) {
    res.send('Hello Express');
});
var Product = /** @class */ (function () {
    function Product(id, title, price, rating, desc, categories) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.rating = rating;
        this.desc = desc;
        this.categories = categories;
    }
    return Product;
}());
exports.Product = Product;
var Comment = /** @class */ (function () {
    function Comment(id, productId, timestamp, user, rating, content) {
        this.id = id;
        this.productId = productId;
        this.timestamp = timestamp;
        this.user = user;
        this.rating = rating;
        this.content = content;
    }
    return Comment;
}());
exports.Comment = Comment;
var products = [
    new Product(1, '飞机', 1.99, 3, '飞机的描述...', ['电子产品', '硬件设备']),
    new Product(2, '火箭', 2.99, 1, '火箭的描述...', ['电子产品', '硬件设备']),
    new Product(3, '大炮', 3.99, 4, '大炮的描述...', ['电子产品', '硬件设备']),
    new Product(4, '卡车', 4.99, 5, '卡车的描述...', ['电子产品', '硬件设备']),
    new Product(5, '游艇', 5.99, 1, '游艇的描述...', ['电子产品', '硬件设备']),
    new Product(6, '天书', 6.99, 0, '原子弹的描述...', ['图书'])
];
var comments = [
    new Comment(1, 1, '2018-02-02 12:22:22', '张三1', 3, '很好，很好。。'),
    new Comment(2, 2, '2018-02-03 13:22:22', '张三2', 4, '很好，很好。。'),
    new Comment(3, 3, '2018-02-04 14:22:22', '张三3', 5, '很好，很好。。'),
    new Comment(4, 4, '2018-02-05 15:22:22', '张三4', 6, '很好，很好。。'),
    new Comment(5, 1, '2018-02-06 16:22:22', '张三5', 1, '很好，很好。。'),
    new Comment(6, 1, '2018-02-07 17:22:22', '张三6', 2, '很好，很好。。'),
];
app.get('/api/products', function (req, res) {
    var result = products;
    var params = req.query;
    if (params.title)
        result = result.filter(function (p) { return p.title.indexOf(params.title) !== -1; });
    if (params.price && result.length > 0)
        result = result.filter(function (p) { return p.price <= parseInt(params.price); });
    if (params.category !== '-1' && result.length > 0)
        result = result.filter(function (p) { return p.categories.indexOf(params.category) !== -1; });
    res.json(result);
});
app.get('/api/product/:id', function (req, res) {
    res.json(products.find(function (product) { return product.id === Number(req.params.id); }));
});
app.get('/api/product/:id/comments', function (req, res) {
    res.json(comments.filter(function (comment) { return comment.productId === Number(req.params.id); }));
});
var server = app.listen(8000, 'localhost', function () {
    console.log('server start, localhost://8000');
});
var subscriptions = new Map();
var wsServer = new ws_1.Server({ port: 8085 });
wsServer.on('connection', function (ws) {
    // ws.send('这个消息是服务器端主动推送的！');
    ws.on('message', function (message) {
        var messageObj = JSON.parse(message);
        var productIds = subscriptions.get(ws) || [];
        subscriptions.set(ws, productIds.concat([messageObj.productId]));
    });
});
var currentBids = new Map();
setInterval(function () {
    products.forEach(function (p) {
        var currentBid = currentBids.get(p.id) || p.price;
        var newBid = currentBid + Math.random() * 5;
        currentBids.set(p.id, newBid);
    });
    subscriptions.forEach(function (productIds, ws) {
        if (ws.readyState === 1) {
            var newBids = productIds.map(function (pid) { return ({
                productId: pid,
                bid: currentBids.get(pid)
            }); });
            ws.send(JSON.stringify(newBids));
        }
        else {
            subscriptions.delete(ws);
        }
    });
}, 5000);
/*
setInterval(() => {
    if (wsServer.clients) {
        wsServer.clients.forEach(client => {
            client.send('这是服务器定时向客户端推送的消息');
        })
    }
}, 2000);
*/
