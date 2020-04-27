const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const validator = require('express-validator');
const fileUpload = require('express-fileupload');
var AWS = require('aws-sdk');
const dotenv = require('dotenv');
const fs = require('fs');
const cron = require("node-cron");
const exec = require('child_process').exec;


/*
if(process.env.NODE_ENV === 'aws'){
  dotenv.config( {path: "./environments/aws.env"});
}else{
  dotenv.config( {path: "./environments/local.env"});
}*/


dotenv.config( {path: "./environments/aws.env"});

const database={
  host:process.env.HOST,
  port:process.env.PORT_DB,
  user:process.env.USER_DB,
  password:process.env.PASSWORD_DB,
  database:process.env.DATABASE
};

AWS.config.update({
    region: 'us-east-1',
    accessKeyId:process.env.ACCES_KEY_ID,
    secretAccessKey:process.env.SECRET_ACCESS_KEY
});

const RUTA_GESTOR_ARCHIVOS = process.env.ruta_gestion_archivos;
//const ses = new AWS.SES({ apiVersion: "2010-12-01" });

//inicializar
const pool = require('./database.js');
const app = express();

//settings 
app.set('port', process.env.PORT || 3000);

//Middlewares

app.use(morgan('dev'));
app.use(express.urlencoded({extended: false})); 
app.use(express.json()); 
app.use(fileUpload());

app.use(session({
   secret: 'alex',
   resave: false,
   saveUninitialized: false,
   store: new MySQLStore(database)
}));

app.use(flash());
//app.use(validator());

//Global variables
app.use ((req, res, next) =>{
  app.locals.success = req.flash('success');
  app.locals.message = req.flash('message');
  app.locals.user = req.user;  
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

console.log("------------------------------------------------------------------------------------------------( " + ((new Date()).toISOString()) +  " )");
cron.schedule("* * * * *", function() {
    console.log("running a task every 10 minutes");

    const sqs = new AWS.SQS({
        accessKeyId: "AKIAJBBD6UGP2WG4WQSA",
        secretAccessKey: "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"
    });

    var queueURL = "https://sqs.us-east-2.amazonaws.com/962103057762/SQS-Response-D";
    var params = {
        AttributeNames: [
            "SentTimestamp"
        ],
        MaxNumberOfMessages: 1,
        MessageAttributeNames: [
            "All"
        ],
        QueueUrl: queueURL,
        VisibilityTimeout: 20,
        WaitTimeSeconds: 0
    };

    sqs.receiveMessage(params, function(err, data) {
        if (err) {
            console.log("Receive Error", err);
        } else if (data.Messages) {
            console.log(data.Messages[0].Body);
            var objectQueue = JSON.parse(data.Messages[0].Body);
            var objectDeleteQueue = data.Messages[0].ReceiptHandle;

            var awsConfig3 = {
                region: "us-east-1",
                endpoint: null,
                accessKeyId: "AKIAJBBD6UGP2WG4WQSA",
                secretAccessKey: "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"
            };
            AWS.config.update(awsConfig3);
            const s3 = new AWS.S3({
                accessKeyId: "AKIAJBBD6UGP2WG4WQSA",
                secretAccessKey: "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"
            });

            const paramsF = {
                Bucket: 's3-bucket-uniandes-d',
                Key: objectQueue.name_video,
            };
            s3.getObject(paramsF, function(err, data) {
                if (err) {
                    throw err;
                }
                fs.writeFileSync("../src/public/uploads/" + objectQueue.contest_id + "/convertido/" + objectQueue.file_name_conv , data.Body);
                console.log('File get object successfully');

                var deleteParams = {
                    QueueUrl: queueURL,
                    ReceiptHandle: objectDeleteQueue
                };
                sqs.deleteMessage(deleteParams, function(err, data) {
                    if (err) {
                        console.log("Delete Error", err);
                    } else {
                        console.log("Successfully added message", data.MessageId);
                        console.log("------------------------------------------------------------------------------------------------( " + ((new Date()).toISOString()) +  " )");
                    }
                });
            });
        }
    });
});

app.listen(app.get('port'), () => {
    console.log('Server en puerto', app.get('port'));
});
