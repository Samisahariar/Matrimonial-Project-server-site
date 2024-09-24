require("dotenv").config()
const express = require("express");
const app = express();
const PORT = process.env.DB_PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


//middlewares
app.use(cors({
  origin: ["http://localhost:5173", "https://genuine-brioche-5d3e32.netlify.app"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

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



const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};


const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'unauthorized' })
  };
  jwt.verify(token, process.env.DB_ACESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  next();
}




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    // Send a ping to confirm a successful connection

    //ALl of the collection is here below the table : 
    const userCollection = client.db("assignment12").collection("users")
    const biodataCollection = client.db("assignment12").collection("biodatas")



    //token related
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.DB_ACESS_TOKEN);
      res
        .cookie('token', token, cookieOptions)
        .send({ success: true })
    })


    app.post('/logout', async (req, res) => {
      const loggedUser = req.body;
      res.clearCookie('token', { ...cookieOptions, maxAge: 0 }).send({ message: "cookie clear successful" })
    })



    //biodata premium
    app.post("/premium/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email }
      const updatedDoc = {
        $set: {
          customer: 'pending'
        }
      };

      const result = await biodataCollection.updateOne(filter, updatedDoc);
      res.send(result);

    })

    app.patch("/premium/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email }
      const updatedDoc = {
        $set: {
          customer: 'premium'
        }
      };

      const result = await biodataCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })


    //biodata approved premium 
    app.get("/pending", verifyToken, async (req, res) => {
      const query = { customer: "pending" }
      const allthebiodata = await biodataCollection.find(query).toArray();
      res.send(allthebiodata)
    })





    //users collection is here and all of the user is processed here

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });


    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users)
    })

    app.get("/users/premium", async (req, res) => {
      const premiumdatas = []
      const users = await userCollection.find({ customer: { $eq: "premium" } }).toArray();
      const biodatas = await biodataCollection.find().toArray();
      users?.map((singledata) => {
        biodatas?.map((singlebiodata) => {

          if (singledata.email === singlebiodata.email) {
            console.log("match found in here the singledata")
          }


          
        })
      })

    })



    app.patch('/users/admin/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })


    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(req.decoded.email)
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })
    app.patch('/users/premium/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          customer: 'premium'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    //allbiodata related api
    app.get("/biodatas", async (req, res) => {
      const result = await biodataCollection.find().toArray();
      res.send(result)
    });


    app.get("/biodatas/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const isThereAnyBiodata = await biodataCollection.findOne(query);
      if (isThereAnyBiodata) {
        res.send({ avail: true })
      } else {
        res.send({ avail: false })
      }
    });

    app.get("/biodata/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const isThereAnyBiodata = await biodataCollection.findOne(query);
      res.send(isThereAnyBiodata)
    })
    //single biodata page
    app.get("/singleDetails/:biodataId", async (req, res) => {
      const biodataId = req.params.biodataId;
      const query = { biodataId: parseInt(biodataId) };
      const result = await biodataCollection.findOne(query);
      res.send(result);
    })



    app.patch("/biodatas/update", async (req, res) => {
      const biodatainfo = req.body;
      const query = { email: biodatainfo.email };
      const isThereAnyBiodata = await biodataCollection.findOne(query);
      const updateDoc = {
        $set: {
          name: isThereAnyBiodata.name,
          height: isThereAnyBiodata.height,
          weight: isThereAnyBiodata.weight,
          exweight: isThereAnyBiodata.exweight,
          exheight: isThereAnyBiodata.exheight,
          email: isThereAnyBiodata.email,
          age: isThereAnyBiodata.age,
          exage: isThereAnyBiodata.exage,
          bddate: isThereAnyBiodata.bddate,
          race: isThereAnyBiodata.race,
          occupation: isThereAnyBiodata.occupation,
          permanentdiv: isThereAnyBiodata.permanentdiv,
          presentdiv: isThereAnyBiodata.presentdiv,
          number: isThereAnyBiodata.number,
          fathersname: isThereAnyBiodata.fathersname,
          mothersname: isThereAnyBiodata.mothersname,
          gender: isThereAnyBiodata.gender,
          image: isThereAnyBiodata.image
        }
      };
      const filter = { email: biodatainfo.email };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });


    app.post("/biodatas/create", async (req, res) => {
      const biodatainfo = req.body;
      const previosCollection = await biodataCollection.find().toArray();
      const biodataId = previosCollection.length + 1
      const newbiodata = { ...biodatainfo, biodataId }
      const result = await biodataCollection.insertOne(newbiodata)
      res.send(result)
    });


    //await client.db("admin").command({ ping: 1 });
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