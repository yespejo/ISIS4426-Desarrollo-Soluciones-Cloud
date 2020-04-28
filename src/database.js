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

/*    const s3 = new AWS.S3({
    	accessKeyId: "AKIAJBBD6UGP2WG4WQSA",
    	secretAccessKey: "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"
    });
*/
    const params = {
    	Bucket: 's3-bucket-uniandes-d',
    };

/*    s3.createBucket(params, function(err, data) {
    	if (err) console.log(err, err.stack);
    	else console.log('Bucket Created Successfully', data.Location);
    });
*/
/*    const sqs = new AWS.SQS({
        accessKeyId: "AKIAJBBD6UGP2WG4WQSA",
        secretAccessKey: "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"
    });
*/
/*    const ses = new AWS.SES({
	accessKeyId: "AKIAJBBD6UGP2WG4WQSA",
        secretAccessKey: "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"
    });
*/
    const awsConfig = {
    	"region": "us-east-2",
    	"endpoint": "http://dynamodb.us-east-2.amazonaws.com",
    	"accessKeyId": "AKIA6AAOPTVRE2U6XSF3", "secretAccessKey": "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"
    };
    AWS.config.update(awsConfig);

    const docClient = new AWS.DynamoDB.DocumentClient();

    pool.aws = docClient;
//    pool.s3 = s3;
//    pool.sqs = sqs;
//    pool.ses = ses;

    if (connection) connection.release();
    console.log('DB is connected');
    return; 

}); 

// promesas a callbacks 
pool.query = promisify(pool.query);

module.exports = pool; 
