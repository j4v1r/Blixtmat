var express = require('express');
var app = express();


const bodyParser = require('body-parser');

// -- MySQL --
const mysql = require('mysql2');

var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'n0m3l0',
    database: 'blixtmat',
    port: 3306
})

con.connect();

// -- Motor de vistas -- 
app.set('view engine', 'ejs');

app.use(express.json());
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(express.static(__dirname + '/public'))

app.get('/', function (req, res) {
    res.render('pages/inicioSesion')
})

app.get('/about', function (req, res) {
    res.render('pages/registro');
})



app.post('/registro', (req, res) => {
    let nombre_per = req.body.nombre_per;
    let apellido = req.body.apellido;
    let fecha = req.body.fecha;
    let boleta = req.body.identificador;
    let usuario = req.body.nombre_user;
    let password = req.body.password;

    con.query('INSERT into musuario (nombre_persona, apellido_persona, fecha_nacimiento, boleta, nombre_usuario, password, id_cusuario) values ("'+nombre_per+'", "'+
    apellido+'", "'+fecha+'", "'+boleta+'","'+usuario+'", "'+password+'",1)', (err, respuesta, fields)=>{
        if(err) return console.log("Error", err);

        return res.redirect('/')

    });

});

app.listen(process.env.PORT||8080, (req, res) => {
    console.log('Escuchando desde el puerto 8080')
})