const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
const myDate = require('./time_module');
const {
    redirect
} = require("express/lib/response");
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
    lastName: String,
    email: String,
    Password: String,
});

const appSchema = new mongoose.Schema({
    name: String,
    //hint: String,
    userID: String

});

const eventSchema = new mongoose.Schema({
    eventName: String,
    startTime: String,
    endTime: String,
    eventMonth: String,
    eventDay: String,
    eventYear: String,
    eventInfo: String,
    appID: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

userCollection = new mongoose.model("User", userSchema);
appCollection = new mongoose.model("App", appSchema);
eventCollection = new mongoose.model("Event", eventSchema);

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

        appCollection.find({
            userID: req.user.id
        }, function (err, foundItems) {
            if (err) {
                console.log(err)
            } else {
                res.render("home", {
                    foundApps: foundItems,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName
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
                        foundApps: foundItems,
                        firstName: "Login"
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
app.get("/logout", function (req, res) {

    req.logout();
    res.redirect("/")
});
app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
    userCollection.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        console.log(user)
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate('local')(req, res, function () {
                userCollection.update({
                    _id: req.user._id
                }, {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName
                }, function (err) {
                    if (err) {
                        console.log(err);
                    }
                })
                res.redirect("/");
            })
        }
    })
});

app.get("/add_item", function (req, res) {
    res.render("add_item", {
        firstName: req.user.firstName,
        lastName: req.user.lastName
    });
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
});

app.get("/apps/:appName", function (req, res) {


    if (req.isAuthenticated) {
        appCollection.find({
            userID: req.user.id,
            name: req.params.appName
        }, function (err, foundApp) { //should be single app for "foundApp"
            console.log(foundApp[0]._id.valueOf());

            eventCollection.find({
                appID: foundApp[0]._id.valueOf()
            }, function (err, foundItems) {
                if (err) {
                    console.log(err);
                } else {
                    var eventsToAdd = [];
                    foundItems.forEach(item => {
                        eventsToAdd.push({
                            title : item.eventName,
                            start : item.startTime,
                            end : item.endTime,
                            url : "/apps"+req.params.appName                          
                        })
                    });
                    console.log(eventsToAdd)
                    res.render("schedule", {
                        date: myDate.getCurrentDate(),
                        appTitle: req.params.appName,
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        foundEvents: eventsToAdd
                    });
                }




            });


        })
    } else {
        res.redirect("/");
    }

});

app.get("/:appName/event-submission", function (req, res) {
    res.render('event-submission', {
        appTitle: req.params.appName,
        firstName: req.user.firstName,
        lastName: req.user.lastName
    });
});
app.post("/:appName/event-submission", function (req, res) { 
    if (req.isAuthenticated) {
        
        appCollection.find({
            userID: req.user.id,
            name: req.params.appName
        }, function (err, foundApp) {
            console.log(foundApp[0])
            eventCollection.insertMany([{
                eventName: req.body.eventName,
                startTime: myDate.getStringDate(req.body.eventYear, req.body.eventMonth, req.body.eventDay, req.body.startTime),
                endTime: myDate.getStringDate(req.body.eventYear, req.body.eventMonth, req.body.eventDay, req.body.endTime),
                eventMonth: req.body.eventMonth,
                eventDay: req.body.eventDay,
                eventYear: req.body.eventYear,
                eventInfo: req.body.eventInfo,
                appID: foundApp[0]._id.valueOf()
            }])
            res.redirect("/apps/" + req.params.appName);
        });

    } else {
        res.redirect("/apps/" + req.params.appName);
    }
})

app.listen(3000, function () {
    console.log("App Management Server Started on Port 3000!")
})