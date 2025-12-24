import credentials from "./credentials.js";
import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";
import express from "express";
const app = express();
import cors from "cors";
import bcrypt from "bcrypt";

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
	nameCollectionAdmin: "admin",
};
const databases = {
	dbCarrouselWatGroeitEr: null,
	dbActiviteiten: null,
	dbInschrijvingen: null,
	dbAdmin: null,
};

async function run() {
	const client = new MongoClient(uri);
	const database = client.db(nameDatabase);
	databases.dbCarrouselWatGroeitEr = database.collection(collections.nameCollectionWatgroeiter);
	databases.dbActiviteiten = database.collection(collections.nameCollectionActiviteiten);
	databases.dbInschrijvingen = database.collection(collections.nameCollectionInschrijvingen);
	databases.dbAdmin = database.collection(collections.nameCollectionAdmin);
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

app.get("/inschrijvingen/:idActiviteit", async (req, res) => {
	console.log(req.params.idActiviteit);
	const idActiviteit = req.params.idActiviteit;
	const inschrijvingen = await databases.dbInschrijvingen.find({ idActiviteit: idActiviteit }).toArray();
	res.send(inschrijvingen);
});

app.post("/inschrijvingen", async (req, res) => {
	let inschrijving = req.body;
	const activityIdUitReqToMongoDbObject = new ObjectId(inschrijving.idActiviteit);

	if (!inschrijving.idActiviteit || !inschrijving.firstName || !inschrijving.lastName || !inschrijving.email || !inschrijving.numberOfPeople) {
		res.status(400).json({ message: "Vul alle gegevens aan aub" });
	} else {
		const inschrijvingId = await databases.dbInschrijvingen.insertOne(inschrijving);
		console.log(inschrijvingId);
		const updateActiviteit = { registrations: { registeredParticipants: inschrijving.numberOfPeople, inschrijvingId: inschrijvingId.insertedId } };
		if (await databases.dbActiviteiten.findOne({ _id: activityIdUitReqToMongoDbObject })) {
			await databases.dbActiviteiten.updateOne({ _id: activityIdUitReqToMongoDbObject }, { $push: updateActiviteit });
			res.send({ message: "Dank je voor je inschrijving, mag je een mail van ons verwachten voor de betaling." });
		} else {
			res.status(404).json({ message: "Activiteit werd niet gevonden" });
		}
	}
});

app.post("/login", async (req, res) => {
	console.log(req.body);
	if (!req.body.password || !req.body.username) {
		return res.status(401).json({ message: "Logingegevens zijn niet correct" });
	}
	const loggedUser = await databases.dbAdmin.findOne({ username: req.body.username });
	if (!loggedUser) {
		return res.status(401).json({ message: "Logingegevens zijn niet correct" });
	}
	const checkPassword = await bcrypt.compare(req.body.password, loggedUser.password);
	if (!checkPassword) {
		res.status(401).json({ message: "Logingegevens zijn niet correct" });
	} else {
		res.send({ message: `Je bent ingelogd!`, username: loggedUser.username });
	}
});

app.patch("/activiteiten/:id", async (req, res) => {
	//console.log(_id);
	const idUitReq = req.params.id;
	const _iduitReqToMongoDbObject = new ObjectId(idUitReq);
	const newData = req.body;

	if (await databases.dbActiviteiten.findOne({ _id: _iduitReqToMongoDbObject })) {
		await databases.dbActiviteiten.updateOne({ _id: _iduitReqToMongoDbObject }, { $set: newData });
		res.send({ message: `Activiteit werd gewijzigd` });
	} else {
		res.status(404).json({ message: "Activiteit werd niet gevonden" });
	}
});

app.post("/activiteiten", async (req, res) => {
	console.log(req.body);

	const newData = req.body;

	await databases.dbActiviteiten.insertOne(newData);
	res.send({ message: `Activiteit werd toegevoegd` });
	/* Vang error server op!
	} */
});

app.delete("/activiteiten/:id", async (req, res) => {
	const idUitReq = req.params.id;
	const _iduitReqToMongoDbObject = new ObjectId(idUitReq);

	if (await databases.dbActiviteiten.findOne({ _id: _iduitReqToMongoDbObject })) {
		await databases.dbActiviteiten.deleteOne({ _id: _iduitReqToMongoDbObject });
		res.send({ message: `Activiteit werd verwijderd` });
	} else {
		res.status(404).json({ message: "Activiteit werd niet gevonden" });
	}
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
	run();
});
