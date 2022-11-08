    // BACKEND
const cors = require('cors')
const path = require('path')
const {savedata, createTrip,savegmmdata,saveG_maps,saveKdashdata}= require("./db.js")


const express=require("express")

const app = express()
//added for the large payload
app.use(express.json({limit : "20mb",extended:true}))
app.use(express.urlencoded({limit: "20mb", extended: true, parameterLimit: 50000}))

app.use(cors())
app.use(express.json())

app.use(express.static(path.join(__dirname,'./static')))

// app.get('/',(req,res) => {
//     res.render('index.html')
// })
 // Tripper pod 
app.post("/api/df", async (req,res)=>{
    const result = await savedata(req.body)
    res.send(result)

})

//creating trip for tripper
app.post("/api/trip/:name", async (req,res)=>{
    const { name } = req.params
    const result = await createTrip(name)
    console.log(result);
    res.json(result)
})
app.post("/api/gmm", async (req,res)=>{
    const result = await savegmmdata(req.body)
    res.send(result)
})

//for g maps
app.post("/api/gmaps", async (req,res)=>{
    const result = await saveG_maps(req.body)
    res.send(result)

})

// for the kdash
app.post("/api/kdash/images", async (req,res)=>{
    const result = await saveKdashdata(req.body)
    res.send(result)

})

app.get('/*', function(req,res) {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(8080); 
