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

let dbCarrouselWatGroeitEr;
let dbActiviteiten;

async function run() {
	const uri = `mongodb+srv://admin_katrijn:${credentials.password}@wildewei.3etdgyv.mongodb.net/?appName=Wildewei`;
	const client = new MongoClient(uri);

	const database = client.db("wildewei_databank");
	dbCarrouselWatGroeitEr = database.collection("watgroeiter");
	dbActiviteiten = database.collection("activiteiten");
}

app.get("/watgroeiter", async (req, res) => {
	const watgroeiterArray = await dbCarrouselWatGroeitEr.find().toArray();
	console.log(watgroeiterArray);
	res.send(watgroeiterArray);
});

app.get("/activiteiten", async (req, res) => {
	let activiteiten = dbActiviteiten.find().sort({ startDate: 1 });

	if (req.query.limit) {
		const limit = Number(req.query.limit);
		activiteiten = activiteiten.limit(limit);
	}
	let activiteitenArray = await activiteiten.toArray();
	console.log(activiteitenArray);
	res.send(activiteitenArray);
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
	run();
});
