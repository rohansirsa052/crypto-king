const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");

const app = express();

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/rohanChannal")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Define schema for storing ticker data
const tickerSchema = new mongoose.Schema({
  name: String,
  last: Number,
  buy: Number,
  sell: Number,
  volume: Number,
  base_unit: String,
});

const Ticker = mongoose.model("Ticker", tickerSchema);

// Fetch top 10 tickers from the API and store them in the database
axios
  .get("https://api.wazirx.com/api/v2/tickers")
  .then((response) => {
    const tickers = response.data;
    const top10Tickers = Object.values(tickers)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);
    const tickerData = top10Tickers.map((t) => ({
      name: t.name,
      last: t.last,
      buy: t.buy,
      sell: t.sell,
      volume: t.volume,
      base_unit: t.base_unit,
    }));

    // Store the ticker data in the database
    Ticker.insertMany(tickerData)
      .then(() => console.log("Tickers stored in the database"))
      .catch((err) => {
        if (err.writeErrors && err.writeErrors.length > 0) {
          console.error(
            "Could not store tickers in the database",
            err.writeErrors
          );
        } else {
          console.error("Could not store tickers in the database", err);
        }
      });
  })
  .catch((err) => console.error("Could not fetch tickers from API", err));

app.use("/", express.static("public"));
app.get("/fetchData", async (req, res) => {
  const data = await Ticker.find({});
  res.send({
    data: data,
  });
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}...`));
