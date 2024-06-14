const express = require("express");
const app = express();
const PORT = process.env.DB_PORT || 5000;


app.get("/", async (req, res) => {
    res.send("the assignment is firing on backend server")
})

app.listen(PORT, () => {
    console.log(`the server is running at the ${PORT}`)
})