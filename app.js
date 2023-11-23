const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//mongoose.connect("mongodb://localhost:27017/todolistDB");
mongoose.connect("mongodb+srv://"+process.env.userID+":"+process.env.mongoDB_PASS_KEY+"@cluster0.zsperxt.mongodb.net/todolistDB");

const itemSchema = {
  name : String
};

const Item = mongoose.model("Item",itemSchema);

//default value
const item1 = new Item({
  name: "Welcome to my todoList"
});
const item2 = new Item({
  name: "Hit the + button to add a new item"
});
const item3 = new Item({
  name: "Select checkbox to delete an item"
});

const defaultItem = [item1,item2,item3];

const listSchema = {
  name : String,
  items : [itemSchema]
}

const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {
  Item.find({}).then(function(foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItem).then(function(err){
        if(!err){
          console.log("Successfully save default item to DB");
        }else{
          console.log(err);
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  }).catch(function(err){
    console.log(err);
  });

});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName}).then(function(foundList){
    //console.log(foundList);
      if(!foundList){
        const list = new List({
            name : customListName,
            items : defaultItem
        });
        list.save();
        res.redirect("/"+customListName);
      }else{
        res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
      }
    
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name : itemName
  });
  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName}).then(function(foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

app.post("/delete",function(req,res){
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName==="Today"){
    Item.findOneAndDelete({_id:checkItemId}).then(function(item){
      if(item){
        console.log("deleted item:"+item);
      }
      res.redirect("/");
    });
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkItemId}}}).then(function(foundList){
      res.redirect("/"+listName);
    });
  }

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
