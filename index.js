const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

const corsConfig = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Origin",
    "X-Requested-With",
    "Accept",
    "x-client-key",
    "x-client-token",
    "x-client-secret",
    "Authorization",
  ],
  credentials: true,
};

//middleware
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized Access!!!" });
  }
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .send({ error: true, message: "Forbidden Access!!!" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cq8nopc.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();


    const usersCollection = client.db("collegeSelectorDb").collection("users");
    const collegeCollection = client.db("collegeSelectorDb").collection("college");
    const studentCollection = client.db("collegeSelectorDb").collection("students");

    // jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "2h",
      });
      res.send({ token });
    });

    // store an user to the database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      console.log(user);
      if (existingUser) {
        return res.send({ message: "User already exists!" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // add a student in database
    app.post("/student", async (req, res) => {
      const student = req.body;
      const query = { email: student.email };
      const existingStudent = await studentCollection.findOne(query);
      console.log(student);
      if (existingStudent) {
        return res.send({ message: "Student already exists!" });
      }
      const result = await studentCollection.insertOne(student);
      res.send(result);
    });

    //get all college
    app.get("/allCollege", async (req, res) => {

      const allCollege = await collegeCollection.find().toArray();
      res.send(allCollege);
    });

    //get popular college
    app.get("/popularCollege", async (req, res) => {
      try {
        const popularCollege = await collegeCollection
          .find()
          .sort({ college_ratings: -1 })
          .limit(3)
          .toArray();
        res.json(popularCollege);
      } catch (error) {
        console.error("Error fetching popular college:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // get a college
    app.get("/allCollege/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await collegeCollection.findOne(query);
      res.send(result);
    });



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
  res.send("Server is Running...");
});

app.listen(port, () => {
  console.log(`Server Running on PORT:  ${port}`);
});