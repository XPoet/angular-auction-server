import * as express from 'express';
import {Server} from 'ws';

import * as path from 'path';

const app = express();

app.use('/', express.static(path.join(__dirname, '..', 'client')));

app.get('/', (req, res) => {
    res.send('Hello Express');
});

export class Product {
    constructor(
        public id: number,
        public title: string,
        public price: number,
        public rating: number,
        public desc: string,
        public categories: Array<string>
    ) {
    }
}

export class Comment {
    constructor(
        public id: number,
        public productId: number,
        public timestamp: string,
        public user: string,
        public rating: number,
        public content: string
    ) {
    }

}

const products: Product[] = [
    new Product(1, '飞机', 1.99, 3, '飞机的描述...', ['电子产品', '硬件设备']),
    new Product(2, '火箭', 2.99, 1, '火箭的描述...', ['电子产品', '硬件设备']),
    new Product(3, '大炮', 3.99, 4, '大炮的描述...', ['电子产品', '硬件设备']),
    new Product(4, '卡车', 4.99, 5, '卡车的描述...', ['电子产品', '硬件设备']),
    new Product(5, '游艇', 5.99, 1, '游艇的描述...', ['电子产品', '硬件设备']),
    new Product(6, '天书', 6.99, 0, '原子弹的描述...', ['图书'])
];

const comments: Comment[] = [
    new Comment(1, 1, '2018-02-02 12:22:22', '张三1', 3, '很好，很好。。'),
    new Comment(2, 2, '2018-02-03 13:22:22', '张三2', 4, '很好，很好。。'),
    new Comment(3, 3, '2018-02-04 14:22:22', '张三3', 5, '很好，很好。。'),
    new Comment(4, 4, '2018-02-05 15:22:22', '张三4', 6, '很好，很好。。'),
    new Comment(5, 1, '2018-02-06 16:22:22', '张三5', 1, '很好，很好。。'),
    new Comment(6, 1, '2018-02-07 17:22:22', '张三6', 2, '很好，很好。。'),
];

app.get('/api/products', (req, res) => {
    let result = products;
    let params = req.query;
    if (params.title) result = result.filter(p => p.title.indexOf(params.title) !== -1);
    if (params.price && result.length > 0) result = result.filter(p => p.price <= parseInt(params.price));
    if (params.category !== '-1' && result.length > 0) result = result.filter(p => p.categories.indexOf(params.category) !== -1);
    res.json(result);
});

app.get('/api/product/:id', (req, res) => {
    res.json(products.find(product => product.id === Number(req.params.id)));
});

app.get('/api/product/:id/comments', (req, res) => {
    res.json(comments.filter((comment: Comment) => comment.productId === Number(req.params.id)));
});

const server = app.listen(8000, 'localhost', () => {
    console.log('server start, localhost://8000');
});


const subscriptions = new Map<any, number[]>();

const wsServer = new Server({port: 8085});
wsServer.on('connection', ws => {
    // ws.send('这个消息是服务器端主动推送的！');
    ws.on('message', (message: any) => {
        let messageObj = JSON.parse(message);
        let productIds = subscriptions.get(ws) || [];
        subscriptions.set(ws, [...productIds, messageObj.productId]);
    })
});


const currentBids = new Map<number, number>();
setInterval(() => {
    products.forEach(p => {
        let currentBid = currentBids.get(p.id) || p.price;
        let newBid = currentBid + Math.random() * 5;
        currentBids.set(p.id, newBid);
    });

    subscriptions.forEach((productIds: number[], ws) => {

        if (ws.readyState === 1) {  // ws 连接成功
            let newBids = productIds.map(pid => ({
                productId: pid,
                bid: currentBids.get(pid)
            }));
            ws.send(JSON.stringify(newBids));
        } else {
            subscriptions.delete(ws);
        }
    })

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
