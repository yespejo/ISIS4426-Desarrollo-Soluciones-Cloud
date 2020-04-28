const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
var AWS = require('aws-sdk');
const pool = require('../database');
const {isLoggedIn} = require('../lib/auth');

var rds = new AWS.RDS({apiVersion: '2014-10-31'});

router.get ('/add', isLoggedIn, (req, res) => {
     res.render('links/add');
});
router.post('/add',isLoggedIn, function (req, res, success){
    
        const archivos = req.body;
        const archivos2 = req.files;
        console.log(archivos2);
        console.log(archivos);
        let image
        if (!req.files) {
          image = null;
        }
        else{
          image=req.files.image
        }
        let nameImage
        image===null?nameImage='no-image':nameImage=image.name;

        const newContest = {
             name: req.body.name,
             image:nameImage,
             url: req.body.url,
             startdate: req.body.startdate,
             enddate: req.body.enddate,
             description: req.body.description,
             user_id: req.user.id
        };

        let save = function () {
            var params = {
                TableName: "contest",
                Item: {
                    namecontest: req.body.name,
                    image:nameImage,
                    url: req.body.url,
                    startdate: req.body.startdate,
                    enddate: req.body.enddate,
                    description: req.body.description,
                    user_id: req.user.id
                }
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

        pool.query('INSERT INTO contest set ?', [newContest], function(err,result){
          if(err){
             throw err; 
          }else{
              pool.query('SELECT * FROM contest WHERE name = ? AND url = ?',[newContest.name, newContest.url], function(err,res){
              if(err){
                throw err
              }else{
                var contestid=res[0].id;

                  console.log("Ruta archivos: ","src/public/uploads/");
                  if(!fs.existsSync("src/public/uploads/"))
                        fs.mkdirSync("src/public/uploads/");
                        fs.mkdirSync("src/public/uploads/" + contestid);
                        fs.mkdirSync("src/public/uploads/" + contestid + '/inicial');
                        fs.mkdirSync("src/public/uploads/" + contestid + '/convertido');
                        if(image!==null){
                            let filename = "concurso-" + contestid + "/" + image.name;
                            image.mv("src/public/uploads/" + contestid + "/" + image.name ,function(err){
                                if(err){
                                    return res.status(500).send(err);
                                }
                                success(result);
                            });
                            success(result);
                        }
                  else{
                      success(result);
                  }
              }
            }); 
        }
      });          
      req.flash('success', 'concurso guardado correctamente');
      res.redirect('/links');
});

router.get('/', isLoggedIn, async (req, res) => {
     const links = await pool.query('SELECT * FROM contest WHERE user_id = ?', [req.user.id]); 
     res.render('links/list', {links});
}); 

router.get ('/delete/:id', isLoggedIn, async (req, res) => {
    
     const { id } = req.params;
     pool.query('SELECT * FROM contest where id = ?', [id], function(err,res){
         if(err){
	     throw err
	 } else {
             let remove = function () {
                 var params = {
                     TableName: "contest",
                     Key: {
                        "url": res[0].url 
             	    }
         	};
         	pool.aws.delete(params, function (err, data) {
                    if (err) {
                        console.log("users::delete::error - " + JSON.stringify(err, null, 2));
                    } else {
                        console.log("users::delete::success");
                   }
         	});
     	     }
             remove();	 
	 }
     });

     await pool.query('DELETE FROM contest WHERE ID = ?', [id]);
     req.flash('success', 'Concurso removido satisfactoriamente');
     res.redirect('/links');
});

router.get ('/edit/:id', isLoggedIn, async (req, res) => {
     const { id } = req.params;
     const contest = await pool.query('SELECT id, name, image, url, DATE_FORMAT(startdate, "%Y-%m-%d") as startdate, DATE_FORMAT(enddate, "%Y-%m-%d") as enddate, DATE_FORMAT(currentdate, "%Y-%m-%d") as currentdate, description, user_id FROM contest where id = ?', [id]);
console.log(contest);
     res.render('links/edit', {contest: contest[0]} );
});

router.post ('/edit/:id', isLoggedIn, async (req, res, success) => {
    
      const archivos = req.body;
      const archivos2 = req.files;
      const { id } = req.params;
      let image
      if (!req.files) {
        image = null;
      }
      else{
        image=req.files.image
      }
      let nameImage
      image===null?nameImage='no-image':nameImage=image.name;
      const newContest = {
          name: req.body.name,
          image:nameImage,
          url: req.body.url,
          startdate: req.body.startdate,
          enddate: req.body.enddate,
          description: req.body.description,
      };
     pool.query('SELECT * FROM contest where id = ?', [id], function(err,res){
         if(err){
             throw err
         } else {
             let modify = function () {
    	         var params = {
                     TableName: "contest",
           	     Key: { "url": res[0].url },
        	     UpdateExpression: "set namecontest = :nameBy, image = :imageBy, startdate = :startdateBy, enddate = :enddateBy, description = :descriptionBy",
        	     ExpressionAttributeValues: {
           	         ":nameBy" : newContest.name, 
            	         ":imageBy" : newContest.image, 
            	         ":startdateBy" : newContest.startdate, 
            	         ":enddateBy" : newContest.enddate,
            	         ":descriptionBy" : newContest.description
        	     },
       		     ReturnValues: "UPDATED_NEW"
    	         };
    	         pool.aws.update(params, function (err, data) {
        	     if (err) {
            	         console.log("191 -> users::update::error - " + JSON.stringify(err, null, 2));
        	     } else {
            	         console.log("193 -> users::update::success "+JSON.stringify(data) );
        	     }
    	        });
	    }
	    modify();
         }
     });
      pool.query('UPDATE contest set ? WHERE id = ?', [newContest, id],function(err,result){
        if (err) {
          throw err
        }else{
          if(fs.existsSync("src/public/uploads/" + id))
            if(image!==null){
                image.mv("src/public/uploads/" + id + "/" + image.name ,function(err){
                    if(err){
                        return res.status(500).send(err);
                    }
                    success(result);
                });
                success(result);
            }
          else{
              success(result);
          }
        }
     });
     req.flash('success', 'Concurso editado satisfactoriamente');
     res.redirect('/links');
});


module.exports = router; 
