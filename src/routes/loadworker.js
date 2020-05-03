const express = require('express');
const router = express.Router();

router.get('/loadworker', (req, res) =>{
    
	var lineTime = new Date().getTime();
	const newVideo = {
		name: 'Prueba',
       	last_name: 'Prueba',
        email: 'yespejo@gmail.com',
        message: 'Prueba',
        original_video: 'load.mov',
        contest_id: lineTime
    };
    pool.query('INSERT INTO videos set ?', [newVideo], function(err){
    	if(err){
            throw err
        }else{
        	const awsConfig2 = {
                region: null,
                endpoint: null,
                accessKeyId: process.env.ACCESS_KEY_ID, 
                secretAccessKey: process.env.SECRET_ACCESS_KEY
            };
            AWS.config.update(awsConfig2);
                       
            const paramsQ = {
                MessageBody: JSON.stringify({
                    order_id: new Date().getTime(),
                    date_video: (new Date()).toISOString(),
                    name_video: 'load.mov'
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
                region: "us-east-2",
                endpoint: "http://dynamodb.us-east-2.amazonaws.com",
                accessKeyId: process.env.ACCESS_KEY_ID, 
                secretAccessKey: process.env.SECRET_ACCESS_KEY
            };
            AWS.config.update(awsConfig);

            pool.query('UPDATE videos SET status = ? WHERE contest_id= ?',["No Convertido",lineTime], function(err,result){
            	console.log("Res Update noConv; ",result)
            	if(err){
              	    throw err;
            	}
     	    });
     	}
    });
    res.render('worker');
});

module.exports = router;