const express = require("express");
const app = express();
const PORT = process.env.DB_PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config()

//middlewares
app.use(cors());
app.use(express.json());

const username = process.env.DB_MONGO_USER;
const password = process.env.DB_MONGO_KEY;

const uri = `mongodb+srv://${username}:${password}@sahariar.8btq1it.mongodb.net/?retryWrites=true&w=majority&appName=Sahariar`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    // Send a ping to confirm a successful connection

    










    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);










app.get("/", async (req, res) => {
    res.send("the assignment is firing on backend server")
})

app.listen(PORT, () => {
    console.log(`the server is running at the ${PORT}`)
})