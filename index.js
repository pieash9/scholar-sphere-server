const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());


// Get JWT Token

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized Aceess' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        req.decoded = decoded;
    })
    next();
}





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rrvausr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



const verifyAdmin = async (req, res, next) => {
    const requester = req.decoded.email;
    const requesterAccount = await usersCollection.findOne({ email: requester });
    if (requesterAccount.role === 'admin' || requesterAccount.role === 'superadmin') {
        next();
    }
    else {
        res.status(403).send({ message: 'forbidden' });
    }
}


const run = async () => {
    try {

        client.connect();

        const usersCollection = client.db("ABCPublications").collection("users");
        const postsCollection = client.db("ABCPublications").collection("posts");

        // post user by email
        app.put('/api/v1/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ result, accessToken: token });
        })


        // get users
        app.get('/api/v1/users', async (req, res) => {
            const query = {};
            const cursor = usersCollection.find(query);
            const users = await cursor.toArray();
            res.send(users)
        })

        // get a user
        app.get('/api/v1/users/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email);
            const query = { email: email }
            const users = await usersCollection.findOne(query);
            res.send(users)
        })


        // delete an user
        app.delete('/api/v1/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })


        // post admin by email
        app.put('/api/v1/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: { role: 'admin' }
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })


        //get admin api 
        app.get("/api/v1/users/isAdmin/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const adminUser = await usersCollection.findOne(query);
            const isAdmin = adminUser?.role === "admin";
            const isSPAdmin = adminUser?.role === "superadmin"
            res.send({ role: isAdmin || isSPAdmin })
        })


        // remove admin by email
        app.put('/api/v1/users/admin/remove/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: { role: 'user' }
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })


        // Create a post
        app.post('/api/v1/posts', async (req, res) => {
            const post = req.body;
            const result = await postsCollection.insertOne(post);
            res.send(result);
        })

        // Approve posts
        app.put('/api/v1/posts/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: { status: 'approve' }
            };
            const result = await postsCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        // get all posts 
        app.get("/api/v1/posts", async (req, res) => {
            const query = {}
            const blogs = await postsCollection.find(query).toArray();
            res.send(blogs)
        })

        // get single blog api data 
        app.get("/api/v1/posts/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const blog = await postsCollection.findOne(query);
            res.send(blog)
        })

        // Delete posts         

        app.delete('/api/v1/posts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await postsCollection.deleteOne(query);
            res.send(result);
        })


    }

    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Running ABC Publications Server");
});
app.listen(port, () => {
    console.log("Listen to Port", port);
});