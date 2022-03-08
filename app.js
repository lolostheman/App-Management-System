const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://localhost:27017/AppDB");

const appSchema = new mongoose.Schema({
    email: String,
    name: String,
    hint: String
});

appCollection = new mongoose.model("App", appSchema);

app.get("/", function(req, res){
    appCollection.find({email: "test1@gmail.com"}, function(err, foundItems){
        if (err) {
            console.log(err);
        } else {
            if (foundItems){
                res.render("home", {foundApps: foundItems});
            }
        }
    })
   
});

app.get("/login", function(req, res){
    res.render("login");
});
app.get("/add_item", function(req, res){
    res.render("add_item");
})

app.post("/add_item", function(req, res){
    if (req.body.addedTitle.length >= 3){
        appCollection.insertMany([{
        email: "test1@gmail.com",
        name: req.body.addedTitle,
        hint: ""
    }], function(err){
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
    
})

app.get("/:appName", function(req, res){
    res.send(req.params.appName)
})

app.listen(3000, function(){
    console.log("App Management Server Started on Port 3000!")
})