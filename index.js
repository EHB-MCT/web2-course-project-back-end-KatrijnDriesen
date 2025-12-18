import credentials from "./credentials.js";
import { MongoClient } from "mongodb";
import express from "express";
const app = express();
import bodyParser from "body-parser";
import cors from "cors";

app.use(bodyParser.json());
app.use(cors());
app.use("/images", express.static("images"));

const port = process.env.PORT || 3000;

console.log("joehoe");

let carrouselWatGroeitEr;
let activiteiten;

async function run() {
	const uri = `mongodb+srv://admin_katrijn:${credentials.password}@wildewei.3etdgyv.mongodb.net/?appName=Wildewei`;
	const client = new MongoClient(uri);

	const database = client.db("wildewei_databank");
	carrouselWatGroeitEr = database.collection("watgroeiter");
	activiteiten = database.collection("activiteiten");
}

app.get("/watgroeiter", async (req, res) => {
	const watgroeiterArray = await carrouselWatGroeitEr.find().toArray();
	console.log(watgroeiterArray);
	res.send(watgroeiterArray);
});

app.get("/eersteActiviteit", async (req, res) => {
	const eersteActiviteit = await activiteiten.find().sort({ startDate: 1 }).limit(1).toArray();
	console.log(eersteActiviteit);
	res.send(eersteActiviteit);
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
	run();
});
