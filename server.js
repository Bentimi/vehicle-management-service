const app = require("./app");
const DB = require("./config/db");
require("dotenv").config();

const port = process.env.PORT

app.listen(port, () => {
    DB();
    console.log(`Server running on http://localhost:${port}`);  
})