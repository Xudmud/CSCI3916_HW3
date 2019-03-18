var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./Movies');
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');

var app = express();
module.exports = app; // for testing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
    })
    .all(function(req, res) {
        //Other methods should return 405 Method Not Allowed
        console.log(req.body);
        res.status(405).send({success: false, msg: 'Unsupported method.'});
    });


router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    })
    .all(function(req, res) {
        console.log(req.body);
        res.status(405).send({success: false, msg: 'Unsupported method.'});
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.route('/signup')
    .post(function(req, res) {
        if (!req.body.username || !req.body.password) {
            res.json({success: false, message: 'Please pass username and password.'});
        }
        else {
            var user = new User();
            user.name = req.body.name;
            user.username = req.body.username;
            user.password = req.body.password;
            // save the user
            user.save(function(err) {
                if (err) {
                    // duplicate entry
                    if (err.code == 11000)
                        //Send a 409 Conflict code, otherwise it will send 200 OK a la Facebook
                        return res.status(409).send({ success: false, message: 'A user with that username already exists. '});
                    else
                        return res.send(err);
                }

                res.json({ success: true, message: 'User created!' });
            });
        }
    })
    .all(function(req,res) {
        console.log(req.body);
        res.status(405).send({success: false, msg: 'Unsupported method.'})
    });


router.route('/signin')
    .post(function(req, res) {
        var userNew = new User();
        userNew.name = req.body.name;
        userNew.username = req.body.username;
        userNew.password = req.body.password;

        User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
            if (err) res.send(err);
            if(user === null) return(res.status(401).send({success: false, message: 'Authentication failed.'}));
            user.comparePassword(userNew.password, function(isMatch){
                if (isMatch) {
                    var userToken = {id: user._id, username: user.username};
                    var token = jwt.sign(userToken, process.env.SECRET_KEY);
                    res.json({success: true, token: 'JWT ' + token});
                }
                else {
                    res.status(401).send({success: false, message: 'Authentication failed.'});
                }
            });
        });
    })
    .all(function(req, res) {
        console.log(req.body);
        res.status(405).send({success: false, msg: 'Unsupported method.'});
    });
//Should have a method for an auth'd user to delete their entry.

//Movies
//Required: Title, Year released, Genre, Three actors.
router.route('/movies')
    //This might be PUT...?
    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        if(!req.body.title || !req.body.year || req.body.actor.length != 3)
            res.json({success: false, msg: 'Please include all required fields!'});
        else {
            var movieNew = new Movie();
            movieNew.title = req.body.title;
            movieNew.year = req.body.year;
            movieNew.genre = req.body.genre;
            movieNew.actor = req.body.actor;

            //Not checking for duplicates, might be multiple movies with the same title.
            movieNew.save(function(err) {
                if(err) {
                    return(res.send(err));
                }
                res.json({success: true, msg: 'Successfully created movie!'})
            });
        }
    })

    .put(authJwtController.isAuthenticated, function (req, res) {
        //How would you "update" the movie data...
        //Send a valid title, then updated information?
        Movie.findOne({ title: req.body.title}).select('title year genre actor').exec(function(err, movie) {
            if(movie === null)
                return(res.status(404).send({success: false, msg: 'Movie not found.'}));

            if(req.body.year)
                movie.year = req.body.year;
            if(req.body.genre)
                movie.genre = req.body.genre;
            if(req.body.actor)
                if(req.body.actor.length != 3){
                    return(res.status(412).send({success: false, msg: 'Please use three actors.'}));
                } else {
                    movie.actor = req.body.actor;
                }


            Movie.update(
                {title: req.body.title},
                {
                    $set: {
                        year: movie.year,
                        genre: movie.genre,
                        actor: movie.actor
                    }
                }
            )
        })
        res.json({success: true, msg: 'Movie updated'});
    })

    .delete(authJwtController.isAuthenticated, function (req, res) {
        //Receives: title to be deleted.
        //Weakness: This will find the first instance and delete that.
        //First check if the movie even exists.
        Movie.findOne({ title: req.body.title}).select('title').exec(function(err, movie) {
            if(movie === null)
                return(res.status(404).send({success: false, msg: 'Movie not found.'}));
            });
        //If so, delete it, throw an error if it fails.
        try {
            Movie.deleteOne({title: req.body.title});
        } catch(e) {
            res.status(404).send(e);
        }
        res.json({success: true, msg: 'Successfully deleted movie.'});

    })

    .get(authJwtController.isAuthenticated, function (req, res) {
        Movie.find(function(err, movies) {
            if(err) res.send(err);
            res.json(movies);
        })
    })

    .all(function(req, res) {
        console.log(req.body);
        res.status(405).send({success: false, msg: 'Unsupported method.'});
    });


app.use('/', router);
app.listen(process.env.PORT || 8080);
