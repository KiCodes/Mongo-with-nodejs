
const { MongoClient, ServerApiVersion } = require('mongodb');

//const uri = "mongodb+srv://KiCodes:9b8mujbN2tcEqOVa@kicodeclusters.1mi3agm.mongodb.net/?retryWrites=true&w=majority";
const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


client.on('close', () => {
    console.log("Connection closed")
})

//running database
async function run(db_name = "test") {
    try {

        await client.connect();
        const db = client.db(db_name);

        await db.command({ ping: 1 })
        console.log("connected succesfully to mongoDB server using connection string " + uri)
        return db

    } catch (err) {
        await client.close();
        console.dir(err)
        process.exit()
    }


}
//creating capped collection
async function createCappedCollection (db, collectionName, options){
    return await db.createCollection(collectionName, options)
}


run("test").then(async (db) => {
    console.log(db);

    collectionName = "robot_logs"
    const collections = await (await client.db().listCollections().toArray()).map( col => col.name);
    let collection = db.collection(collectionName);
    console.log(collections)

    if(!(collections.includes(collectionName))){
        collection = await createCappedCollection(db, collectionName, {
        capped: true,
        size: 100000,    
        max: 10
        })
    }

    const isCapped = await collection.isCapped();
    console.log(isCapped)

    let count = 0;

    
    //store event in db
    function LogEvent(number){
        collection.insertOne({v: number, createdAt: new Date()})
    }
    //read events from db
    async function getEvents () {
        return await collection.find().limit(10).toArray()
    }
    //store events every one second
    const storeLog = setInterval( ()=>{
            LogEvent(count++)
        }, 1000)
    
        //read event every 1.5 seconds
    const readLogs = setInterval(async ()=>{
            console.log(await getEvents())
        }, 1500)

    //stop storing after 10 seconds
    setTimeout(()=> {
        clearInterval(storeLog)
        clearInterval(readLogs)
    }, 15000)

})



process.on("exit", async (db) => {
    console.log({ code })
    client.close(true, () => {
        console.log(`Connection closed for db: ${client?.db?.databaseName}`)
    })
    client.emit('close')
})