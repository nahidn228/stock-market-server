const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Stock Market is Running!");
});

app.listen(port, () => {
  console.log(`stock-market listening on port ${port}`);
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dssil.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const stockCollection = client.db("stockCollectionDB").collection("stocks");

    // app.get("/stocks", async (req, res) => {
    //   const result = await stockCollection.find().toArray();
    //   res.send(result);
    // });

    app.get("/stocks", async (req, res) => {
      try {
        let { page, limit } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 20;
        const skip = (page - 1) * limit;
        const result = await stockCollection
          .find()
          .skip(skip)
          .limit(limit)
          .toArray();
        const total = await stockCollection.countDocuments();
        res.send({
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          data: result,
        });
      } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.post("/stock", async (req, res) => {
      const data = req.body;
      const result = await stockCollection.insertOne(data);
      res.send(result);
    });

    //DELETE
    app.delete("/stockData/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await stockCollection.deleteOne(query);
      res.send(result);
    });
    //Find
    app.get("/stock/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await stockCollection.findOne(query);
      res.send(result);
    });

    //UPDATE
    app.put("/stockData/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateData = req.body;
      const updated = {
        $set: {
          date: updateData.date,
          trade_code: updateData.trade_code,
          high: updateData.high,
          low: updateData.low,
          open: updateData.open,
          close: updateData.close,
          volume: updateData.volume,
        },
      };
      const result = await stockCollection.updateOne(filter, updated, options);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
