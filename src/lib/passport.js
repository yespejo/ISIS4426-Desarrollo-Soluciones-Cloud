const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database'); 
const helpers = require('./helpers'); 

passport.use('local.signin', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
    let fetchOneByKey = function () {
    	var params = {
            TableName: "users",
            Key: {
                "username": username
            }
        };
    	pool.aws.get(params, function (err, data) {
            if (err) {
                console.log("21->users::fetchOneByKey::error - " + JSON.stringify(err, null, 2));
            }
            else {
                console.log("24->users::fetchOneByKey::success - " + JSON.stringify(data, null, 2));
           }
    	})
   }
   fetchOneByKey();
	
   const rows = await pool.query('SELECT * FROM users WHERE username = ?', [username]); 
   if(rows.length > 0) {
       const user = rows[0];
       const validPassword = await helpers.matchPassword(password, user.password);
       if (validPassword) {
           done(null, user, req.flash('success', 'Bienvenido ' + user.username)); 
       } else {
           done(null, false, req.flash('message', 'Contraseña invalida.'));
       }
   }else {
       return done(null, false, req.flash('message', 'No existe el nombre de usuario.')); 
   }
})); 

passport.use('local.signup', new LocalStrategy ({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
      
    const { name } = req.body; 
    const { lastname } = req.body;
    const { email } = req.body;  
    const newUser = {
       username,
       password,
       name,
       lastname,
       email
    };

    let save = function () {
    	var params = {
            TableName: "users",
            Item:  newUser 
    	};
    	pool.aws.put(params, function (err, data) {
            if (err) {
                console.log("users::save::error - " + JSON.stringify(err, null, 2));
            } else {
                console.log("users::save::success" );
            }
        });
    }
    save();

    newUser.password = await helpers.encrypPassword(password);  
    const result = await pool.query('INSERT INTO users SET ?', [newUser]);
    newUser.id = result.insertId; 
    return done(null, newUser);
}));


passport.serializeUser((user, done) => {

    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
   const rows = await pool.query('SELECT * FROM users where id = ?', [id]);
   done(null, rows[0]);
}); 

