//example code was used for static files in Express https://expressjs.com/en/starter/static-files.html#serving-static-files-in-express
//app.use('/static', express.static('public'))

//example code was used to create a Mongo ObjectId
//https://www.baeldung.com/mongo-generate-unique-objectid

import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";
import express from "express";
const app = express();
import cors from "cors";
import bcrypt from "bcrypt";
import "dotenv/config";

app.use(cors());
app.use(express.json());
app.use("/images", express.static("images"));

const port = process.env.PORT || 3000;

console.log("joehoe");
const uri = process.env.MONGODB_URI;
const nameDatabase = "wildewei_databank";
const collections = {
	nameCollectionWatgroeiter: "watgroeiter",
	nameCollectionActiviteiten: "activiteiten",
	nameCollectionInschrijvingen: "inschrijvingen",
	nameCollectionAdmin: "admin",
	nameCollectionImgs: "imgs",
};
const databases = {
	dbCarrouselWatGroeitEr: null,
	dbActiviteiten: null,
	dbInschrijvingen: null,
	dbAdmin: null,
	dbImgs: null,
};

async function run() {
	const client = new MongoClient(uri);
	const database = client.db(nameDatabase);
	databases.dbCarrouselWatGroeitEr = database.collection(collections.nameCollectionWatgroeiter);
	databases.dbActiviteiten = database.collection(collections.nameCollectionActiviteiten);
	databases.dbInschrijvingen = database.collection(collections.nameCollectionInschrijvingen);
	databases.dbAdmin = database.collection(collections.nameCollectionAdmin);
	databases.dbImgs = database.collection(collections.nameCollectionImgs);
}

app.get("/watgroeiter", async (req, res) => {
	try {
		const watgroeiterArray = await databases.dbCarrouselWatGroeitEr.find().toArray();
		console.log(watgroeiterArray);
		res.send(watgroeiterArray);
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: "Oeps, er ging iets mis" });
	}
});

app.get("/activiteiten", async (req, res) => {
	try {
		let activiteiten = await databases.dbActiviteiten.find().sort({ startDate: 1 });

		if (req.query.limit) {
			const limit = Number(req.query.limit);
			activiteiten = activiteiten.limit(limit);
		}
		let activiteitenArray = await activiteiten.toArray();
		//console.log(activiteitenArray);
		res.send(activiteitenArray);
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: "Oeps, er ging iets mis" });
	}
});

app.get("/inschrijvingen/:idActiviteit", async (req, res) => {
	try {
		console.log(req.params.idActiviteit);
		const idActiviteit = req.params.idActiviteit;
		const inschrijvingen = await databases.dbInschrijvingen.find({ idActiviteit: idActiviteit }).toArray();
		res.send(inschrijvingen);
	} catch (error) {
		res.status(500).json({ message: "Oeps, er ging iets mis" });
	}
});

app.get("/afbeeldingen", async (req, res) => {
	try {
		let afbeeldingenArray = await databases.dbImgs.find().toArray();
		//console.log(afbeeldingenArray);
		res.send(afbeeldingenArray);
	} catch (error) {
		res.status(500).json({ message: "Oeps, er ging iets mis" });
	}
});

app.post("/inschrijvingen", async (req, res) => {
	try {
		let inschrijving = req.body;
		if (!inschrijving.idActiviteit || !inschrijving.firstName || !inschrijving.lastName || !inschrijving.email || !inschrijving.numberOfPeople) {
			res.status(400).json({ message: "Vul alle gegevens aan aub" });
		}
		const activityIdUitReqToMongoDbObject = new ObjectId(inschrijving.idActiviteit);
		if (!(await databases.dbActiviteiten.findOne({ _id: activityIdUitReqToMongoDbObject }))) {
			res.status(404).json({ message: "Activiteit werd niet gevonden" });
		}
		const inschrijvingId = await databases.dbInschrijvingen.insertOne(inschrijving);
		//console.log(inschrijvingId);
		const updateActiviteit = { registrations: { registeredParticipants: inschrijving.numberOfPeople, inschrijvingId: inschrijvingId.insertedId } };
		await databases.dbActiviteiten.updateOne({ _id: activityIdUitReqToMongoDbObject }, { $push: updateActiviteit });
		res.send({ message: "Dank je voor je inschrijving, mag je een mail van ons verwachten voor de betaling." });
	} catch (error) {
		res.status(500).json({ message: "Oeps, er ging iets mis" });
	}
});

app.post("/login", async (req, res) => {
	try {
		console.log(req.body);
		if (!req.body.password || !req.body.username) {
			res.status(401).json({ message: "Logingegevens zijn niet correct" });
		}
		const loggedUser = await databases.dbAdmin.findOne({ username: req.body.username });
		if (!loggedUser) {
			res.status(401).json({ message: "Logingegevens zijn niet correct" });
		}
		if (!(await bcrypt.compare(req.body.password, loggedUser.password))) {
			res.status(401).json({ message: "Logingegevens zijn niet correct" });
		}
		res.send({ message: `Je bent ingelogd!`, username: loggedUser.username });
	} catch (error) {
		res.status(500).json({ message: "Oeps, er ging iets mis" });
	}
});

app.patch("/activiteiten/:id", async (req, res) => {
	try {
		//console.log(_id);
		const idUitReq = req.params.id;
		const _iduitReqToMongoDbObject = new ObjectId(idUitReq);
		const newData = req.body;
		if (!(await databases.dbActiviteiten.findOne({ _id: _iduitReqToMongoDbObject }))) {
			res.status(404).json({ message: "Activiteit werd niet gevonden" });
		}
		await databases.dbActiviteiten.updateOne({ _id: _iduitReqToMongoDbObject }, { $set: newData });
		res.send({ message: `Activiteit werd gewijzigd` });
	} catch (error) {
		res.status(500).json({ message: "Oeps, er ging iets mis" });
	}
});

app.post("/activiteiten", async (req, res) => {
	try {
		//console.log(req.body);
		const newData = req.body;
		await databases.dbActiviteiten.insertOne(newData);
		res.send({ message: `Activiteit werd toegevoegd` });
	} catch (error) {
		res.status(500).json({ message: "Oeps, er ging iets mis" });
	}
});

app.delete("/activiteiten/:id", async (req, res) => {
	try {
		const idUitReq = req.params.id;
		const _iduitReqToMongoDbObject = new ObjectId(idUitReq);

		if (!(await databases.dbActiviteiten.findOne({ _id: _iduitReqToMongoDbObject }))) {
			res.status(404).json({ message: "Activiteit werd niet gevonden" });
		}
		await databases.dbActiviteiten.deleteOne({ _id: _iduitReqToMongoDbObject });
		res.send({ message: `Activiteit werd verwijderd` });
	} catch (error) {
		res.status(500).json({ message: "Oeps, er ging iets mis" });
	}
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
	run();
});
