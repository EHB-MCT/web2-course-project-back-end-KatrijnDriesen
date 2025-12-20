import credentials from "./credentials.js";
import { MongoClient } from "mongodb";
import express from "express";
const app = express();
import cors from "cors";

app.use(cors());
app.use(express.json());
app.use("/images", express.static("images"));

const port = process.env.PORT || 3000;

console.log("joehoe");

const uri = `mongodb+srv://admin_katrijn:${credentials.password}@wildewei.3etdgyv.mongodb.net/?appName=Wildewei`;
const nameDatabase = "wildewei_databank";
const collections = {
	nameCollectionWatgroeiter: "watgroeiter",
	nameCollectionActiviteiten: "activiteiten",
	nameCollectionInschrijvingen: "inschrijvingen",
};
const databases = {
	dbCarrouselWatGroeitEr: null,
	dbActiviteiten: null,
	dbInschrijvingen: null,
};

async function run() {
	const client = new MongoClient(uri);
	const database = client.db(nameDatabase);
	databases.dbCarrouselWatGroeitEr = database.collection(collections.nameCollectionWatgroeiter);
	databases.dbActiviteiten = database.collection(collections.nameCollectionActiviteiten);
	databases.dbInschrijvingen = database.collection(collections.nameCollectionInschrijvingen);
}

app.get("/watgroeiter", async (req, res) => {
	const watgroeiterArray = await databases.dbCarrouselWatGroeitEr.find().toArray();
	console.log(watgroeiterArray);
	res.send(watgroeiterArray);
});

app.get("/activiteiten", async (req, res) => {
	let activiteiten = databases.dbActiviteiten.find().sort({ startDate: 1 });

	if (req.query.limit) {
		const limit = Number(req.query.limit);
		activiteiten = activiteiten.limit(limit);
	}
	let activiteitenArray = await activiteiten.toArray();
	console.log(activiteitenArray);
	res.send(activiteitenArray);
});

app.post("/inschrijving", async (req, res) => {
	let inschrijving = req.body;
	if (!inschrijving.email || !inschrijving.numberOfPeople) {
		res.status(400).json({ message: "Vul aub een emailadres en het aantal personen in" });
	} else {
		await databases.dbInschrijvingen.insertOne(inschrijving);
		res.send({ message: "Dank je voor je inschrijving, mag je een mail van ons verwachten voor de betaling." });
	}
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
	run();
});
