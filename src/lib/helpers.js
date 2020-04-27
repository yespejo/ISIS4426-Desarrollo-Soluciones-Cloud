const bcryt = require('bcryptjs');

const helpers = {};

helpers.encrypPassword = async (password) => {
  const salt = await bcryt.genSalt(10);
  const hash = await bcryt.hash(password, salt);
  return hash;
};

helpers.matchPassword = async (password, savedPasword) => {
    
    try{
        return await bcryt.compare(password, savedPasword);
    }catch(e){
        console.log(e)
    }
    
};

module.exports = helpers; 