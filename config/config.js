
//This module is for exporting the environment variables
const dotenv= require ('dotenv')//require dependencie
dotenv.config()//stablish configuration
//Export environment variables
module.exports={
    port: process.env.PORT, 
    connectionString: process.env.MONGODB_URI
};

