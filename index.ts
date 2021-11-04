import express, { json } from "express";
import { nanoid } from "nanoid";
import { Sequelize, DataTypes } from "sequelize";

const app = express();
const port = 4040;
const db = new Sequelize ({
    dialect: "sqlite",
    storage: "./app.sqlite",
    define: {
        timestamps: false
    }
})
const urlsTable = db.define("url", {
    original: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    shortened: {
        type: DataTypes.STRING(21),
        allowNull: false,
        primaryKey: true,
    },
    requestsAmount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
    }
});



db.sync({force: false}).then(urList => {
    console.log("Connected to database")
});

app.use(json());

app.get('/', (req, res) => {
    var origin = req.get('host');
    res.status(500).send('If you are using that service \n first time - you are free to visit that api page \n' + 'http://' +origin+'/api.html');
})

app.get('/api', (req, res) =>{
    res.status(200).sendFile(`${__dirname}/templates/api.min.html`);
})


app.get('/:url', (req, res) => {
    urlsTable.findByPk(req.params.url)

    .then(url => {
        if (url) {
            res.set('location',  url.getDataValue("original"))
            res.status(301).json({
                redirectTo: url.getDataValue("original"),
            });
            urlsTable.update({requestsAmount: url.getDataValue("requestsAmount") + 1}, {
                where: {
                    shortened: req.params.url
                }
            });
        }
        else {
            res.status(404).sendFile(__dirname + "/templates/badRequest.min.html");
        } 
    })
    .catch(errValue => {
        console.log(errValue);
        // res.status(500).send(errValue);
        res.status(500).sendFile(__dirname + "/templates/forbidden.min.html")
    })
});

app.get('/:url/views', (req, res) => {
    urlsTable.findByPk(req.params.url)
    .then(url => {
        if (url) res.status(200).json({viewCount: url.getDataValue('requestsAmount')});
        else res.status(404).sendFile(__dirname + "/../templates/badRequest.min.html");
    })
    .catch(errValue => {
        console.log(errValue);
        res.status(500).sendFile(__dirname + "/templates/forbidden.min.html")
    })
});

app.post('/shorten', (req, res) => {
    var origin = req.get('host');
    urlsTable.create({
        original: req.body.urlToShorten,
        shortened: nanoid()
    })
    .then(urList=> {

        res.status(201).json({
            status: "created",
            shortenedUrl: 'http://' + origin + "/" + urList.getDataValue("shortened")
        });
    })
    .catch((errValue) => {
        console.log(errValue);
        res.status(500).sendFile(__dirname + "/templates/forbidden.min.html");
    });
});

app.listen(port, () => {
    console.log(`Link shortener started on ${port} port`)
    console.log(`If you are using that service \n first time - you are free to visit that api page \n http://thisService:${port}/${"api.html"}`)
})