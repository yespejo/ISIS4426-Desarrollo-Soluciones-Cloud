const express = require('express');
const router = express.Router();

router.get('/loadworker', (req, res) =>{
    console.log("hecho");
    res.render('worker');
});

module.exports = router;