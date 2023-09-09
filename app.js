const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

require("dotenv").config();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);
app.use(
	session({
		secret: "My Secret",
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });

// ENABLE IF YOU GET AN ERROR
// mongoose.set("useCreateIndex", true)

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	googleId: String,
});

// Add Passport local plugin to the 'mongoose schema' must be a mongoose schema
userSchema.plugin(passportLocalMongoose);

// Add FindOrCreate plugin to schema to use the function FinOrCreate, which does not normally exist in mongoose or mongodb
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// passport.use(new LocalStrategy(User.authenticate()));
passport.use(User.createStrategy());

// Create cookie and read cookie
passport.serializeUser((user, cb) => {
	process.nextTick(() => {
		cb(null, { id: user.id, username: user.username, name: user.name });
	});
});

passport.deserializeUser((user, cb) => {
	process.nextTick(() => {
		return cb(null, user);
	});
});

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "http://localhost:3000/auth/google/secrets",
			// userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
		},
		(accessToken, refreshToken, profile, cb) => {
			User.findOrCreate({ googleId: profile.id }, (err, user) => {
				return cb(err, user);
			});
		}
	)
);

app.get("/", (req, res) => {
	res.render("home");
});

// Google Authentication Route
app.get(
	"/auth/google",
	passport.authenticate("google", { scope: ["profile", "email"] })
);

//Google callback route to display after authentication
app.get(
	"/auth/google/secrets",
	passport.authenticate("google", { failureRedirect: "/login" }),
	(req, res) => {
		// If successful redirection
		console.log("Successfully logged in..");
		res.redirect("/secrets");
	}
);

app.get("/login", (req, res) => {
	res.render("login");
});

app.get("/register", (req, res) => {
	res.render("register");
});

app.get("/secrets", (req, res) => {
	if (req.isAuthenticated()) {
		res.render("secrets");
	} else {
		res.redirect("login");
	}
});

app.post("/register", (req, res) => {
	User.register(
		{ username: req.body.username },
		req.body.password,
		(err, user) => {
			if (err) {
				console.error(err);
				res.redirect("/register");
			} else {
				passport.authenticate("local")(req, res, () => {
					res.redirect("/secrets");
				});
			}
		}
	);
});

// This only works if your 'name' field in your HTML is named with one of the conventional login names used, such as 'username' and 'password'. Passport will look for those fields and search for them.
app.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/secrets",
		failureRedirect: "/login",
	})
);

app.get("/logout", (req, res) => {
	// Logout user
	req.logout((err) => {
		if (err) {
			console.error(err);
		} else {
			console.log("Successfully logged out...");
		}
	});

	// Destroy the session(not necessary)
	// req.session.destroy((err) => {
	// 	if (err) {
	// 		console.error(err);
	// 	}
	// });

	res.redirect("/");
});

app.listen(3000, () => {
	console.log("Server started on port 3000...");
});
