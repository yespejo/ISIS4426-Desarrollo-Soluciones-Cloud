const mysql = require('mysql');
const { promisify } = require('util');
const AWS = require("aws-sdk");
const fs = require('fs');


const database={
    host:process.env.HOST,
    port:process.env.PORT_DB,
    user:process.env.USER_DB,
    password:process.env.PASSWORD_DB,
    database:process.env.DATABASE
};

console.log(database);

const pool = mysql.createPool(database); 

pool.getConnection((err, connection) => {
 
     if(err) {

        if (err.code === 'PROTOCOL_CONNECTION_LOST'){
            console.error('DATABASE CONNECTION WAS CLOSED'); 
        }
        if (err.code === 'ER_CON_COUNT_ERROR'){
            console.error('DATABASE HAS TO MANY CONNECTIONS');
        }
        if (err.code ==='ECONNREFUSED') {
            console.error('DATABASE CONNECTION WAS REFUSED');
        }
    }

    AWS.config.update({
        region: "us-east-2",
        endpoint: "http://dynamodb.us-east-2.amazonaws.com",
        accessKeyId: process.env.ACCESS_KEY_ID, 
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    });

    pool.aws = new AWS.DynamoDB.DocumentClient();

    pool.s3 = new AWS.S3({
        accessKeyId: process.env.ACCESS_KEY_ID, 
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    });

    pool.sqs = new AWS.SQS({
        accessKeyId: process.env.ACCESS_KEY_ID, 
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    });

    if (connection) connection.release();
    console.log('DB is connected');
    return; 

}); 

pool.query = promisify(pool.query);

module.exports = pool; 
