import * as express from 'express';
import * as path from 'path';
import {Server} from "ws";

const app = express();

export class Product {
    constructor(public id: number,
                public title: string,
                public price: number,
                public rating: number,
                public desc: string,
                public categories: Array<string>) {
    }
}

export class Comment {
    constructor(public id: number,
                public productId: number,
                public timeStap: string,
                public user: string,
                public rating: number,
                public content: string) {
    }
}

const products: Product[] = [
    new Product(1, '第一个商品', 1.99, 3.5, '这是一个商品，是我在学习慕课网Angular入门实战时创建的', ['电子产品', '硬件设备']),
    new Product(2, '第二个商品', 2.99, 2.5, '这是二个商品，是我在学习慕课网Angular入门实战时创建的', ['电子产品', '硬件设备']),
    new Product(3, '第三个商品', 3.99, 4.5, '这是三个商品，是我在学习慕课网Angular入门实战时创建的', ['硬件设备']),
    new Product(4, '第四个商品', 4.99, 1.5, '这是四个商品，是我在学习慕课网Angular入门实战时创建的', ['电子产品']),
    new Product(5, '第五个商品', 5.99, 3.5, '这是五个商品，是我在学习慕课网Angular入门实战时创建的', ['电子产品', '硬件设备']),
    new Product(6, '第六个商品', 6.99, 2.5, '这是六个商品，是我在学习慕课网Angular入门实战时创建的', ['图书'])
];

const comments: Comment[] = [
    new Comment(1,1,'2017-02-02 22:22:22', '张三', 3, '东西不错'),
    new Comment(2,2,'2017-03-03 15:22:22', '李四', 4, '东西不错'),
    new Comment(3,3,'2017-04-04 22:13:22', '王五', 2, '东西不错'),
    new Comment(4,4,'2017-05-05 20:22:22', '赵六', 5, '东西不错')
];

// 当访问根目录时，通过express框架找静态资源：当前目录 向上找一级 找client文件夹，默认会找index.html
app.use('/', express.static(path.join(__dirname, '..', 'client')));

app.get('/', (req, res) => {
    res.send('Hello Express');
});

app.get('/products', (req, res) => {
    // res.send('接受到商品查询请求');
    let result = products;
    let params = req.query;
    console.log(params);
    if (params.title) {
        result = result.filter((p) => p.title.indexOf(params.title) !==-1 );
    }
    if (params.price && result.length > 0) {
        result = result.filter((p) => p.price <= parseInt(params.price));
    }
    if (params.category && params.category !== '-1' && result.length > 0) {
        result = result.filter((p) => p.categories.indexOf(params.category) !==-1);
    }
    res.json(result);
});

app.get('/products/:id', (req, res) => {
    res.json(products.find((product) => product.id == req.params.id));
});

app.get('/products/:id/comments', (req, res) => {
    res.json(comments.filter((comment) => comment.productId == req.params.id));
});

const server = app.listen(8000, 'localhost', ()=> {
    console.log("服务器已启动，地址是:http://localhost:8000");
});

// 存储每个客户端订阅了哪些信息，key:当前连接的socket
const subscription = new Map<any, number[]>();

const wsServer= new Server({port:8085});
wsServer.on('connection', websocket => {
    // websocket.send('这个消息是服务器主动推送的');
    websocket.on('message', message => {
        let messageObj = JSON.parse(message);
        // 取该客户端以前存储的id信息
        let productIds = subscription.get(websocket) || [];
        // 重新设置                     老的ID  加上  新推上来的ids
        subscription.set(websocket, [...productIds, messageObj.productId]);
    })
});

const cunrentBids = new Map<number, number>();

setInterval(() => {
    //判断websocket服务器上是否有客户端连接着
    // if(wsServer.clients) {
    //     // 遍历所有的客户端，广播消息
    //     wsServer.clients.forEach(client => {
    //         client.send('这是定时推送');
    //     })
    // }

    products.forEach( p => {
       let currentBid = cunrentBids.get(p.id) || p.price;
       let newBid = currentBid + Math.random() * 5;
       cunrentBids.set(p.id, newBid);
    });

    subscription.forEach((productId: number[], ws) => {
        if (ws.readyState === 1) {
            let newBids = productId.map( pid => ({
                productId: pid,
                    bid: cunrentBids.get(pid)
            });
            ws.send(JSON.stringify(newBids));
        } else {
            subscription.delete(ws);
        }

    });
}, 2000);



