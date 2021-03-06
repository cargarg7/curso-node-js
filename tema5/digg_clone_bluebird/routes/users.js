var express = require('express');
var auth = require('../simpleauth');

var User = require('../models/user');

var usersController = {
  //Crea un nuevo usuario (registro)
  create: function(req, res) {
    console.log('Register user', req.body);
    if(req.body.password !== req.body.passwordconfirm){
      res.status(400).send('Passwords no coinciden');
    }
    else {
       User.save({
        email: req.body.username,
        name: req.body.name,
        date: Date.now(),
        password: req.body.password
       }).then(function(user){
        delete user.password;
        res.status(200).send(user);
       })
    }
  },
  //Devuelve la información del usuario
  //req.user está ya en request (por simpleAuth)
  me: function(req, res) {
    res.status(200).send(req.user);
  },
  //Devuelve la información del usuario
  login: function(req, res) {
    res.status(200).send(req.user);
  }
};

var router = express.Router();
router.post('/session', auth.createSession(), usersController.login);
router.post('/users', usersController.create);
router.get('/me', auth.requiresToken, usersController.me);

module.exports = router;
