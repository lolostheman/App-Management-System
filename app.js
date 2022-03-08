const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/AppDB");
const userSchema = new mongoose.Schema({
    firstName: String,
    LastName: String,
    email: String,
    Password: String,
});

const appSchema = new mongoose.Schema({
    name: String,
    hint: String,
    userID: String

});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

userCollection = new mongoose.model("User", userSchema);
appCollection = new mongoose.model("App", appSchema);

passport.use(userCollection.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    userCollection.findById(id, function (err, user) {
        done(err, user);
    });
});

app.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        console.log(req.user.id);
        appCollection.find({
            userID: req.user.id
        }, function (err, foundItems) {
            if (err) {
                console.log(err)
            } else {
                res.render("home", {
                    foundApps: foundItems
                })
            }
        })
    } else {
        appCollection.find({
            email: "test1@gmail.com"
        }, function (err, foundItems) {
            if (err) {
                console.log(err);
            } else {
                if (foundItems) {
                    res.render("home", {
                        foundApps: foundItems
                    });
                }
            }
        })
    }


});

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", function (req, res) {
    const user = new userCollection({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/");
            })
        }
    })
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
    userCollection.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect("/");
            })
        }
    })
});

app.get("/add_item", function (req, res) {
    res.render("add_item");
})

app.post("/add_item", function (req, res) {
    if (req.isAuthenticated) {
        if (req.body.addedTitle.length >= 3) {
            appCollection.insertMany([{
                name: req.body.addedTitle,
                hint: "",
                userID: req.user.id
            }], function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully added to App");
                    res.redirect("/")
                }
            })
        } else {
            res.redirect("/")
        }
    } else {
        res.redirect("/login");
    }


})

app.get("/:appName", function (req, res) {
    res.send(req.params.appName)
})

app.listen(3000, function () {
    console.log("App Management Server Started on Port 3000!")
})