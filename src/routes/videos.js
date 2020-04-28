const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
var AWS = require('aws-sdk');
const exec = require('child_process').exec;
var nameurl = [];
const RUTA_GESTOR_ARCHIVOS_RAIZ = process.env.ruta_gestion_archivos_raiz;
const RUTA_GESTOR_ARCHIVOS = process.env.ruta_gestion_archivos;
const {isLoggedIn} = require('../lib/auth');



// Set the region 




/*
AWS.config.update({
  region: 'us-east-1',
  accessKeyId:process.env.ACCES_KEY_ID,
  secretAccessKey:process.env.SECRET_ACCESS_KEY
});
*/










var rds = new AWS.RDS({apiVersion: '2014-10-31'});

   // Init Upload

const pool = require('../database');

//const {isLoggedIn} = require('../lib/auth');
router.get ('/add', (req, res) => {
    const { url } = req.params;
    console.log("URL add: ",url);
    nameurl[0]=url;

    let fetchOneByKey = function () {
        var params = {
            TableName: "contest",
            Key: {
                "url": "'" + [url] + "'"
            }
        };
        pool.aws.get(params, function (err, data) {
            if (err) {
                console.log("42 -> users::fetchOneByKey::error - " + JSON.stringify(err, null, 2));
            }
            else {
                console.log("45 -> users::fetchOneByKey::success - " + JSON.stringify(data, null, 2));
           }
        })
    }
    fetchOneByKey();

    pool.query('SELECT * FROM contest WHERE url = ?', [url], function(err,result){
      if(err){
        throw err
      }else{
        const links=result[0];
        console.log("Valor de links:", links);
        res.render('videos/addvideo',{links});
      }
    }); 
    
});

router.get('/:url', async (req, res) => {

    var isLogged=true;  
    const { url } = req.params;
    console.log("URL get: ",url);
    nameurl[0]=url;

    let fetchOneByKey = function () {
        var params = {
            TableName: "contest",
            Key: {
                "url": "'" + [url] +  "'"
            }
        };
        pool.aws.get(params, function (err, data) {
            if (err) {
                console.log("79 -> users::fetchOneByKey::error - " + JSON.stringify(err, null, 2));
            }
            else {
                console.log("82 -> users::fetchOneByKey::success - " + JSON.stringify(data, null, 2));
           }
        })
    }
    fetchOneByKey();	

    const links = await pool.query('SELECT * FROM contest WHERE url = ?', [url]);

    const videos = await pool.query('SELECT * FROM videos WHERE contest_id = ?', [links[0].id]);
    //res.render('videos/addvideo',{links});
    res.render('videos/listvideos', {videos:videos, url:url, isLogged:isLogged});
}); 

router.get('/add/:url', async (req, res) => {

    const { url } = req.params;
    console.log("URL",url);
    nameurl[0]=url; 

    let fetchOneByKey = function () {
        var params = {
            TableName: "contest",
            Key: {
                "url": "'" + [url] + "'"
            }
        };
        pool.aws.get(params, function (err, data) {
            if (err) {
                console.log("128 -> users::fetchOneByKey::error - " + JSON.stringify(err, null, 2));
            }
            else {
                console.log("131 -> users::fetchOneByKey::success - " + JSON.stringify(data, null, 2));
           }
        })
    }
    fetchOneByKey();

    const links = await pool.query('SELECT * FROM contest WHERE url = ?', [url]); 

    const videos = await pool.query('SELECT * FROM videos WHERE contest_id = ?', [links[0].id]);
    console.log(links[0].id);
    console.log(videos);
    res.render('videos/addvideo',{links});
    //res.render('videos/listvideos', {videos,links});
}); 

router.post('/add/id/:id', function (req, res, success){
   
  const { id } = req.params;
  let contestid;

  pool.query('SELECT * FROM contest WHERE id = ?',[id], function(err,result){
      if (err){
        throw err
      }else{
        contestid=result[0].id;
        let originvideo
        if (!req.files) {
          originvideo = null;
        }
        else{
          originvideo=req.files.originalvideo;
        }
        console.log("origin: ",req.files);
        let nameVideo
        originvideo===null?nameVideo='no-video':nameVideo=originvideo.name;   
        var nombreCompleto = nameVideo.split('.');
        var extension = nombreCompleto[nombreCompleto.length - 1];
        const newVideo = {
            name: req.body.name,
            last_name: req.body.lastname,
            email: req.body.email,
            message: req.body.message,
            original_video: nameVideo,
            contest_id: contestid
        };
        const newVideoD = {
            naime_video: req.body.name,
            last_name: req.body.lastname,
            email: req.body.email,
            message: req.body.message,
            original_video: nameVideo,
            contest_id: contestid
        };

        let save = function () {
            var params = {
                TableName: "videos",
                Item:  newVideoD
            };
            pool.aws.put(params, function (err, data) {
                if (err) {
                    console.log("202 -> users::save::error - " + JSON.stringify(err, null, 2));
                } else {
                    console.log("204 -> users::save::success" );
                }
            });
        }
        save();

        console.log("Video", newVideo.original_video);
        pool.query('INSERT INTO videos set ?', [newVideo], function(err){
          if(err){
            throw err
          }else{
            let status;
            if(fs.existsSync(RUTA_GESTOR_ARCHIVOS+contestid+'//inicial')){
                if(originvideo!==null){
                    originvideo.mv(RUTA_GESTOR_ARCHIVOS+contestid+`//inicial//${originvideo.name}`,function(err, result){
                        if(err){
                            throw err;
                        }
                    });
                    if(extension==="mp4"){
                        status="Convertido";
                        originvideo.mv(RUTA_GESTOR_ARCHIVOS+contestid+`//convertido//${originvideo.name}`,function(err, result){
                            if(err){
                                throw err;
                            }
                        });
             	        let modify = function () {
                 	    var params = {
                     	    	TableName: "videos",
                     	   	Key: { "email": newVideo.email },
                     	        UpdateExpression: "set status_video = :statusBy",
                     		ExpressionAttributeValues: {
                         	    ":statusBy" : "Convertido"
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
                      	pool.query('UPDATE into videos set status = ? '[status], function(err){
                            if(err){
                          	throw err;
                            }
                      	});
                    }else{
                      	status="No Convertido";
                        let modify = function () {
                            var params = {
                                TableName: "videos",
                                Key: { "email": newVideo.email },
                                UpdateExpression: "set status_video = :statusBy",
                                ExpressionAttributeValues: {
                                    ":statusBy" : "No Convertido"
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
                      	pool.query('UPDATE into videos set status = ? '[status], function(err){
                            if(err){
                          	throw err;
                            }
                      	});
                    }
                }
                /*else{
                    success(result);
                }*/
                success(result);
            }
          }
        });
      }
  });
  pool.query('SELECT * FROM contest WHERE id = ?', [id], function(err,result){
    if(err){
      throw err
    }
    console.log(result);
    var data=result[0].url;
    var page='/videos/'+data;
    res.redirect(page);
  });
});

router.post('/add/url/:url', function (req, res, success){
   
  const { url } = req.params;
  let contestid;

  pool.query('SELECT * FROM contest WHERE url = ?',[url], function(err,result){
      if (err){
        throw err
      }else{
        console.log(result[0]);
        contestid=result[0].id;
        let originvideo
        if (!req.files) {
          originvideo = null;
        }
        else{
          originvideo=req.files.originalvideo;
        }
        console.log("origin: ",req.files);
        var nameVideo
        originvideo===null?nameVideo='no-video':nameVideo=originvideo.name;   
        var nombreCompleto = nameVideo.split('.');
        var extension = nombreCompleto[nombreCompleto.length - 1];
        const newVideo = {
            name: req.body.name,
            last_name: req.body.lastname,
            email: req.body.email,
            message: req.body.message,
            original_video: nameVideo,
            contest_id: contestid
        };
	var dt = new Date();
    var videoQ = dt.getTime() + "-" + nameVideo;
        const newVideoD = {
            name_video: req.body.name,
            last_name: req.body.lastname,
            email: req.body.email,
            message: req.body.message,
            original_video: videoQ,
            contest_id: contestid,
	    status_video: "-", 
	    converted_video: "-"
        };

        let save = function () {
            var params = {
                TableName: "videos",
                Item:  newVideoD
            };
            pool.aws.put(params, function (err, data) {
                if (err) {
                    console.log("303 -> users::save::error - " + JSON.stringify(err, null, 2));
                } else {
                    console.log("305 -> users::save::success" );
                }
            });
        }
        save();
        pool.query('INSERT INTO videos set ?', [newVideo], function(err){
          if(err){
            throw err
          }else{
            if(fs.existsSync(RUTA_GESTOR_ARCHIVOS+contestid+'//inicial')){
                if(originvideo!==null){
                    originvideo.mv(RUTA_GESTOR_ARCHIVOS+contestid+`//inicial//${originvideo.name}`,function(err, result){
                        if(err){
                            throw err;
                        }
			const awsConfig2 = {
        		    "region": null,
        		    "endpoint": null,
        		    "accessKeyId": "AKIA6AAOPTVRE2U6XSF3", "secretAccessKey": "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"
    			};
    			AWS.config.update(awsConfig2);
    			const fileContent = fs.readFileSync(RUTA_GESTOR_ARCHIVOS+contestid+ '/inicial/' + originvideo.name);
    			const paramsF = {
          		    Bucket: 's3-bucket-uniandes-d',
        		    Key: dt.getTime() + "-" + originvideo.name,
        		    Body: fileContent
    			};
    			pool.s3.upload(paramsF, function(err, data) {
        		    if (err) {
            			throw err;
        		    }
        		    console.log('File uploaded successfully');
    			});

    			const awsConfig = {
        		    "region": "us-east-2",
        		    "endpoint": "http://dynamodb.us-east-2.amazonaws.com",
        		    "accessKeyId": "AKIA6AAOPTVRE2U6XSF3", "secretAccessKey": "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"
    			};
    			AWS.config.update(awsConfig);
                    });
                }
            }
            success(result);
          }
        });
        let status;
        if(extension==="mp4"){
            status="Convertido";
            var convertedPath=RUTA_GESTOR_ARCHIVOS+contestid+'/convertido/'+nameVideo
            originvideo.mv(RUTA_GESTOR_ARCHIVOS+contestid+`//convertido//${originvideo.name}`,function(err){
            	if(err){
                    throw err;
               	}
            });
    	    setTimeout(function(){ 
                let modify = function () {
                    var params = {
                        TableName: "videos",
                        Key: { "email": newVideo.email },
                        UpdateExpression: "set status_video = :statusBy, converted_video = :convertedVideoBy",
                        ExpressionAttributeValues: {
                            ":statusBy" : "Convertido",
                            ":convertedVideoBy" : nameVideo
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
    	    }, 1000);

           const awsConfig2 = {
                "region": null,
                "endpoint": null,
                "accessKeyId": "AKIA6AAOPTVRE2U6XSF3", "secretAccessKey": "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"
            };
            AWS.config.update(awsConfig2);

            const paramsM = {
                Destination: { 
                    ToAddresses: [newVideo.email]
                },
                Message: {
                    Body: {
                        Html: {
                            Charset: "UTF-8",
                            Data: "<html><body><h1>Hola " + newVideo.name + " " + newVideo.last_name + "</h1><p style='color:red'>Tu video se proceso sin problemas </p> <p>" + newVideo.original_video + "</p></body></html>"
                        },
                        Text: {
                            Charset: "UTF-8",
                            Data: "Hola " + newVideo.name + " " + newVideo.last_name + " Tu video se proceso sin problemas " + newVideo.original_video 
                        }
                    },
                    Subject: {
                        Charset: "UTF-8",
                        Data: "Video procesado"
                    }
                },
                Source: "yeismer@minka.io"
            };
            const sendEmail = pool.ses.sendEmail(paramsM).promise();
            sendEmail.then(data => {
                console.log("email submitted to SES", data);
            }).catch(error => {
                console.log(error);
            });

            const awsConfig = {
                "region": "us-east-2",
                "endpoint": "http://dynamodb.us-east-2.amazonaws.com",
                "accessKeyId": "AKIA6AAOPTVRE2U6XSF3", "secretAccessKey": "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"
            };
            AWS.config.update(awsConfig);

            setTimeout(function(){ 
        	    pool.query('UPDATE videos SET status = ?, converted_video = ? WHERE original_video= ?',[status,videoQ,nameVideo], function(err,result){
                    console.log("Res Update conv: ",result)
                    if(err){
                  	    throw err;
                    }
                });
            }, 2000);
        } else {
    	    status="No Convertido";

    	    setTimeout(function(){

                let modify = function () {
                    var params = {
                        TableName: "videos",
                        Key: { "email": newVideo.email },
                        UpdateExpression: "set status_video = :statusBy",
                        ExpressionAttributeValues: {
                            ":statusBy" : "No Convertido"
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
    	
    	    }, 1000);

           const awsConfig2 = {
                "region": null,
                "endpoint": null,
                "accessKeyId": "AKIA6AAOPTVRE2U6XSF3", "secretAccessKey": "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"
            };
            AWS.config.update(awsConfig2);
                       
            const paramsQ = {
                MessageBody: JSON.stringify({
                    order_id: new Date().getTime(),
                    date_video: (new Date()).toISOString(),
                    name_video: videoQ
                }),
                QueueUrl: 'https://sqs.us-east-2.amazonaws.com/962103057762/SQS-Deployment-D'
            };

            pool.sqs.sendMessage(paramsQ, (err, data) => {
                if (err) {
                    console.log("Error", err);
                } else {
                    console.log("Successfully added message", data.MessageId);
                }
            });

            const awsConfig = {
                "region": "us-east-2",
                "endpoint": "http://dynamodb.us-east-2.amazonaws.com",
                "accessKeyId": "AKIA6AAOPTVRE2U6XSF3", "secretAccessKey": "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"
            };
            AWS.config.update(awsConfig);

            pool.query('UPDATE videos SET status = ? WHERE original_video= ?',[status,nameVideo], function(err,result){
            	console.log("Res Update noConv; ",result)
            	if(err){
              	    throw err;
            	}
     	    });
        }
      }
  });
  var page='/videos/add/'+url;
  res.redirect(page);
});


module.exports = router; 
