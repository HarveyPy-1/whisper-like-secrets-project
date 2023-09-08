const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5")
const { error } = require("console");

require('dotenv').config()

const app = express();

app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);


mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema ({
	email: String,
	password: String,
});


const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
	res.render("home");
});

app.get("/login", (req, res) => {
	res.render("login");
});

app.get("/register", (req, res) => {
	res.render("register");
});

app.post("/register", (req, res) => {
	const newUser = new User({
		email: req.body.username,
		password: md5(req.body.password),
	});

	newUser
		.save()
		.then(() => {
			console.log("User saved successfully....");
		})
		.catch((error) => {
			console.error(error);
		});

	res.render("secrets");
});

app.post("/login", (req, res) => {
	const username = req.body.username;
	const password = req.body.password;

	User.findOne({ email: username })
		.then((foundUser) => {
			if (foundUser) {
				if (foundUser.password === md5(password)) {
					res.render("secrets");
					console.log("Login Successful...");
				}
			}
		})
		.catch((err) => {
			console.error(err);
		});
});

app.listen(3000, () => {
	console.log("Server started on port 3000...");
});
