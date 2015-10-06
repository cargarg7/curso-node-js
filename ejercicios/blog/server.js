"use strict";

var express = require("express"),
    app = express(),
    Promise = require("bluebird"),
    Q = require("q"),
    redis = require("redis"),
    client = redis.createClient(),
    op = Q.ninvoke.bind(Q, client),
    auth = require("./simpleAuth");

Promise.promisifyAll(client);

app.use(require("static-favicon")());
app.use(require("body-parser")());
app.use(require("method-override")());
app.set("views", "./views");
app.set("view engine", "jade");

function extend() {
  var args = [].slice.call(arguments);
  return args.reduce(function(acc, el) {
    for (var k in el) { acc[k] = el[k]; }
    return acc;
  });
}

/* Models */

var postsKey = "blog:posts";

var postsController = {
  index: function(req, res) {
    client.lrangeAsync(postsKey, 0, -1)
      .then(function(posts) {
        posts = posts.map(JSON.parse);
        res.render("post-list", {posts: posts});
      });
  },
  show: function(req, res) {
    res.render("post-detail", {post: req.post});
  },
  "new": function(req, res) {
    res.render("new-post", {post: {}});
  },
  create: function(req, res) {
    var post = {title: req.body.title, content: req.body.content};
    client.llenAsync(postsKey)
      .then(function(len) {
        post.id = len;
        return client.rpushAsync(postsKey, JSON.stringify(post));
      })
      .then(function() {
        res.redirect('/posts/' + post.id);
      });
  },
  edit: function(req, res) {
    res.render("new-post", {post: req.post});
  },
  update: function(req, res) {
    req.post.title = req.body.title;
    req.post.content = req.body.content;

    client.lsetAsync(postsKey, req.post.id, JSON.stringify(post))
      .then(function() {
        res.render("post-detail", {post: post});
      });
  },
  "delete": function(req, res) {
    //no podemos eliminar por valor!!!
    res.redirect("/posts");
  },
  param: function(req, res, next, postId) {
    client.lindexAsync(postsKey, postId)
      .then(function(post) {
        req.post = JSON.parse(post);
        next();
      });
  }
};

function resources(app, name, controller) {
  app.get("/"+name, controller.index);
  app.get("/"+name+"/new", controller.new);
  app.post("/"+name, controller.create);
  app.get("/"+name+"/:"+name+"id", controller.show);
  app.get("/"+name+"/:"+name+"id/edit", controller.edit);
  app.put("/"+name+"/:"+name+"id", controller.update);
  app.delete("/"+name+"/:"+name+"id", controller.delete);
  if (controller.param) { app.param(name + "id", controller.param); }
}

resources(app, "posts", postsController);

app.use(express.static(__dirname + "/public"));
app.get("/pete", function() {
  throw new Error("Oh, no!");
});

/* Errors */

app.use(function(req, res, next) {
  res.send(404, "Pagina no encontrada");
});

app.use(function(err, req, res, next) {
  console.log(req.url, Date.now(), err.message);
  res.send(500, "Ocurrio algun error..");
});

app.listen(3000);

/* Populate */

// var post = new Post({title: "Prueba", content: "Esto es una prueba"});
// post.save();
