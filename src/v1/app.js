//APP.JS
//IMPORT LIBRARIES
const express= require("express");
const {port, connectionString} = require ('../../config/config')
const bodyParser= require('body-parser');
const MongoClient= require('mongodb').MongoClient;
const app= express();
const dotenv = require('dotenv')
const path =require('path')
dotenv.config();//RUN DOTENV TO MAKE SERVER.JS READING THE .ENV FILE
//This variable is for the purpose of capturing the time that the endpoint was called. 
const queryDate = new Date().toString('en-US', {
    timeZone: 'America/Bogota'
  });
  
var hours = new Date().getHours({
    timeZone: 'America/Bogota'
  })*100 //Multiplied by 100 because it allows to check if the
//To check if a store is open
var mins= new Date().getMinutes({
    timeZone: 'America/Bogota'
  })
const queryTime = hours+mins // It outputs the time as a four digit number (e.g. 12:34 to 1234), it is usefull to check if the store is open. 
//SWAGGER
const swaggerUI=require("swagger-ui-express");
const swaggerJsDoc =require ("../v1/docs/swagger.json");

 //MIDDLEWARES
 app.use(express.json())
 app.use (express.static('public'))
 app.use(express.urlencoded({ extended: true }));
 app.use ("/api-docs", swaggerUI.serve,swaggerUI.setup(swaggerJsDoc) )

/////////////////////////////////////////////////////////////////
//THIS IS A PROMISE FOR THE PURPOSE OF CONNECTING TO THE MONGO DB



MongoClient.connect(connectionString, { useUnifiedTopology: true })//CONNECTION TO DATABASE
    .then (client => {
        console.log(`connected to database to database.`)
        const db= client.db("stores")
        const storeCollection= db.collection("storesData") 
        const trackingCollection= db.collection('queriesTracking')  
        //CONNECTION TO LOCALHOST
        app.listen(port, ()=>{
            console.log(`listening to port ${port}`)
        })

        
//HOME ENDPOINT... NOTHING EXTRAORDINARY, JUST A HELLO 
             
         /**
 * @swagger
 * tags:
 *  -name: username
 *  */    
        app.get ('/', function (req, res){
                    
            res.send ("</h1>Welcome To Instastore!</h1>") 
        })

        //THIS ENDPOINT EXECUTES TWO QUERIES, THE FIRST ONE IS FINDING THE NEAREST STORE. FOR THAT PURPOSE I USED FINDONE FUNCTION.
/**
 * @swagger
 * 
 *  
 *  */    
        app.get('/v1/instaStore', function (req, res)
        {
        storeCollection.createIndex({"location":"2dsphere"})
            const storeFound=storeCollection.findOne(
            {
                location:
                    { $near :
                        {
                            $geometry: { type: "Point", 
                                coordinates: [ -73.9667, 40.78 ] },
                        }
                    }
                
            }, function (err, storeFound)
                    {
                        //I decided sorting time, due to the way we place time fields in the database (0000 - 2359). 
                        var storeServiceTime=  new Float32Array ([storeFound.Opening, storeFound.Closing]);
                        storeServiceTime= storeServiceTime.sort()//Sort time
                        
                    
                    if(queryTime < storeServiceTime[0] || queryTime > storeServiceTime[1]){
                        openStore= "Store available for deliveries" //Store will be marked as available if it is between the opening and closing time
                //I defined ranges to secure a linearity about delivery times (assuming 3 deliveries per hour= delivery every 20 mins).
                            if (mins >= 0 && mins<=20){
                                mins= Math.abs(mins-20)
                            }
                            if (mins >=21 && mins<=40){
                                mins= Math.abs(mins-40)
                            }
                            if (mins >= 41 && mins<=59){
                                mins= Math.abs(mins-60)
                            }
                            nextDeliveryTime= new Date (Date.now() + (mins*60*1000)).toString({timeZone: 'America/Bogota'})
                        }else{
                        openStore = "Store not available for deliveries" //store will not be marked as available if the query time is out of the working schedule
                        nextDeliveryTime = "The store is not delivering." // This message will be delivered if store is not available
                        }
                    

                        //JSON OUTPUT OF THE QUERY 
                        queryOutput = {
                            storeId: storeFound._id,
                            storeName: storeFound.name,
                            isOpen: openStore,
                            latitude: storeFound.location.coordinates[0],
                            longitude: storeFound.location.coordinates[1],
                            nextDeliveryTime:nextDeliveryTime   
                        }
            
                
                        //SUBMIT THE JSON Output
                        res.json(queryOutput)
                        //Query to keep track of the called end point. It returns Date, time, city and found store of the query
                        const tracking=  trackingCollection.insertOne({
                            endPointCallingTime: queryDate,
                            queryCity:storeFound.city,
                            storeFound:storeFound.name
                            })
                            if(tracking){
                            console.log("Thank you for using instastore!")
                            }else{
                            console.log("Tracking could not saved")
                            }
                            if(storeFound){
                            console.log("Store Found by Instastore")
                            }else{
                            console.log("Store could not be found. Check your query")
                            }
                    

            }
            
            )
            
        
        })
            
            
              
     }).catch(error => console.log(error))
    

