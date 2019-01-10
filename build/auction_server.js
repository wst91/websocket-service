"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var path = require("path");
var ws_1 = require("ws");
var app = express();
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
    function Comment(id, productId, timeStap, user, rating, content) {
        this.id = id;
        this.productId = productId;
        this.timeStap = timeStap;
        this.user = user;
        this.rating = rating;
        this.content = content;
    }
    return Comment;
}());
exports.Comment = Comment;
var products = [
    new Product(1, '第一个商品', 1.99, 3.5, '这是一个商品，是我在学习慕课网Angular入门实战时创建的', ['电子产品', '硬件设备']),
    new Product(2, '第二个商品', 2.99, 2.5, '这是二个商品，是我在学习慕课网Angular入门实战时创建的', ['电子产品', '硬件设备']),
    new Product(3, '第三个商品', 3.99, 4.5, '这是三个商品，是我在学习慕课网Angular入门实战时创建的', ['硬件设备']),
    new Product(4, '第四个商品', 4.99, 1.5, '这是四个商品，是我在学习慕课网Angular入门实战时创建的', ['电子产品']),
    new Product(5, '第五个商品', 5.99, 3.5, '这是五个商品，是我在学习慕课网Angular入门实战时创建的', ['电子产品', '硬件设备']),
    new Product(6, '第六个商品', 6.99, 2.5, '这是六个商品，是我在学习慕课网Angular入门实战时创建的', ['图书'])
];
var comments = [
    new Comment(1, 1, '2017-02-02 22:22:22', '张三', 3, '东西不错'),
    new Comment(2, 2, '2017-03-03 15:22:22', '李四', 4, '东西不错'),
    new Comment(3, 3, '2017-04-04 22:13:22', '王五', 2, '东西不错'),
    new Comment(4, 4, '2017-05-05 20:22:22', '赵六', 5, '东西不错')
];
// 当访问根目录时，通过express框架找静态资源：当前目录 向上找一级 找client文件夹，默认会找index.html
app.use('/', express.static(path.join(__dirname, '..', 'client')));
app.get('/', function (req, res) {
    res.send('Hello Express');
});
app.get('/products', function (req, res) {
    // res.send('接受到商品查询请求');
    var result = products;
    var params = req.query;
    console.log(params);
    if (params.title) {
        result = result.filter(function (p) { return p.title.indexOf(params.title) !== -1; });
    }
    if (params.price && result.length > 0) {
        result = result.filter(function (p) { return p.price <= parseInt(params.price); });
    }
    if (params.category && params.category !== '-1' && result.length > 0) {
        result = result.filter(function (p) { return p.categories.indexOf(params.category) !== -1; });
    }
    res.json(result);
});
app.get('/products/:id', function (req, res) {
    res.json(products.find(function (product) { return product.id == req.params.id; }));
});
app.get('/products/:id/comments', function (req, res) {
    res.json(comments.filter(function (comment) { return comment.productId == req.params.id; }));
});
var server = app.listen(8000, 'localhost', function () {
    console.log("服务器已启动，地址是:http://localhost:8000");
});
// 存储每个客户端订阅了哪些信息，key:当前连接的socket
var subscription = new Map();
var wsServer = new ws_1.Server({ port: 8085 });
wsServer.on('connection', function (websocket) {
    // websocket.send('这个消息是服务器主动推送的');
    websocket.on('message', function (message) {
        var messageObj = JSON.parse(message);
        // 取该客户端以前存储的id信息
        var productIds = subscription.get(websocket) || [];
        // 重新设置                     老的ID  加上  新推上来的ids
        subscription.set(websocket, productIds.concat([messageObj.productId]));
    });
});
var cunrentBids = new Map();
setInterval(function () {
    //判断websocket服务器上是否有客户端连接着
    // if(wsServer.clients) {
    //     // 遍历所有的客户端，广播消息
    //     wsServer.clients.forEach(client => {
    //         client.send('这是定时推送');
    //     })
    // }
    products.forEach(function (p) {
        var currentBid = cunrentBids.get(p.id) || p.price;
        var newBid = currentBid + Math.random() * 5;
        cunrentBids.set(p.id, newBid);
    });
    subscription.forEach(function (productId, ws) {
        if (ws.readyState === 1) {
            var newBids = productId.map(function (pid) { return ({
                productId: pid,
                bid: cunrentBids.get(pid)
            }); });
            ws.send(JSON.stringify(newBids));
        }
        else {
            subscription.delete(ws);
        }
    });
}, 2000);
