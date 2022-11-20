var express = require('express');
var app = express();


const bodyParser = require('body-parser');

// -- MySQL --
const mysql = require('mysql2');

var con = mysql.createConnection({
    host: 'localhost',
    user: 'Alejandro',
    password: 'gl0rfInd3#',
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


// -- Renders GENERAL -- 

app.get('/', (req, res) => {
    res.render('pages/inicioSesion')
})

app.get('/about', (req, res) => {
    res.render('pages/registro');
})

app.get('/menudia', (req, res) => {

    con.query('select * from vistamenu', (err, respuesta, fields) => {
        if (err) {
            console.log("Error", err)
        } else {
            console.log(respuesta);
            res.render('pages/menudeldia', { entrada: respuesta[0], plato: respuesta[1], postre: respuesta[2], bebida: respuesta[3] })
        }

    })

})

app.get('/productos', (req, res) => {

    con.query('select * from mproducto where id_csubproducto=5', (err5, respuesta5, fields5) => {
        if (err5) {
            console.log("Error5", err5)
        } else {
            con.query('select * from mproducto where id_csubproducto=6', (err6, respuesta6, fields6) => {
                if (err6) {
                    console.log("Error6", err6)
                } else {
                    con.query('select * from mproducto where id_csubproducto=7', (err7, respuesta7, fields7) => {
                        if (err7) {
                            console.log("Error7", err7)
                        } else {
                            con.query('select * from mproducto where id_csubproducto=8', (err8, respuesta8, fields8) => {
                                if (err8) {
                                    console.log("Error8", err8)
                                } else {
                                    con.query('select * from mproducto where id_csubproducto=9', (err9, respuesta9, fields5) => {
                                        if (err9) {
                                            console.log("Error9", err9)
                                        } else {
                                            con.query('select * from mproducto where id_csubproducto=10', (err10, respuesta10, fields10) => {
                                                if (err10) {
                                                    console.log("Error10", err10)
                                                } else {
                                                    res.render('pages/productos', { respuesta5: respuesta5, respuesta6: respuesta6, respuesta7: respuesta7, respuesta8: respuesta8, respuesta9: respuesta9, respuesta10: respuesta10 })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    })


})

app.get('/productosEmp', (req, res)=>{
    con.query('select * from mproducto where id_csubproducto=5', (err5, respuesta5, fields5) => {
        if (err5) {
            console.log("Error5", err5)
        } else {
            con.query('select * from mproducto where id_csubproducto=6', (err6, respuesta6, fields6) => {
                if (err6) {
                    console.log("Error6", err6)
                } else {
                    con.query('select * from mproducto where id_csubproducto=7', (err7, respuesta7, fields7) => {
                        if (err7) {
                            console.log("Error7", err7)
                        } else {
                            con.query('select * from mproducto where id_csubproducto=8', (err8, respuesta8, fields8) => {
                                if (err8) {
                                    console.log("Error8", err8)
                                } else {
                                    con.query('select * from mproducto where id_csubproducto=9', (err9, respuesta9, fields5) => {
                                        if (err9) {
                                            console.log("Error9", err9)
                                        } else {
                                            con.query('select * from mproducto where id_csubproducto=10', (err10, respuesta10, fields10) => {
                                                if (err10) {
                                                    console.log("Error10", err10)
                                                } else {
                                                    res.render('pages/productosEmpleado', { respuesta5: respuesta5, respuesta6: respuesta6, respuesta7: respuesta7, respuesta8: respuesta8, respuesta9: respuesta9, respuesta10: respuesta10 })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    })

})

app.get('/desc_producto/:id', (req, res) => {

    let id_mproducto = req.params.id;
    console.log(id_mproducto)
    con.query('select * from mproducto where id_mproducto=' + id_mproducto + '', (err, respuesta1, fields) => {
        if (err) {
            console.log('Error', err)
        } else {
            console.log(respuesta1)
            res.render('pages/descripcion_producto', {respuesta1: respuesta1})
        }

    })

})

/*
app.get('/productos', (req, res) => {

    con.query('select * from csubproducto where id_csubproducto>4', (err, respuesta, fields) => {
        if (err) {
            console.log('Error', err)
        } else {
            console.log(respuesta.length)
            res.render('pages/productos', { respuesta: respuesta})
            for(let i=5; i<respuesta.length+5;i++ ){
                let salida = `respuesta${i}`;
                console.log(salida)
                con.query('select * from mproducto where id_csubproducto='+i+'', (err, salida, fields)=>{
                    if(err){
                        console.log("Error",err)
                    }else{
                        console.log(salida);
                        //console.log(`Esto es el length de las queries: ${salida}`)
                    }
                })
            }
            /*
            con.query('select * from mproducto', (err1, respuesta1, fields1) => {
                if (err1) {
                    console.log('Error', err1)
                } else {
                    console.log(respuesta1)
                    
                }

            })

        }

    })

})
*/


// -- Renders ADMIN/EMPLEADO --

app.get('/crearmenu', (req, res) => {
    res.render('pages/crearmenu');
})

app.get('/recargar', (req, res) => {
    res.render('pages/recarga')
})


// -- Funciones del CLIENTE -- 

app.post('/registro', (req, res) => {
    let nombre_per = req.body.nombre_per;
    let apellido = req.body.apellido;
    let fecha = req.body.fecha;
    let boleta = req.body.identificador;
    let usuario = req.body.nombre_user;
    let password = req.body.password;

    con.query('INSERT into musuario (nombre_persona, apellido_persona, fecha_nacimiento, boleta, nombre_usuario, password, id_cusuario) values ("' + nombre_per + '", "' +
        apellido + '", "' + fecha + '", "' + boleta + '","' + usuario + '", "' + password + '",1)', (err, respuesta, fields) => {
            if (err) return console.log("Error", err);

            return res.redirect('/')

        });

});



// -- Funciones del ADMIN/EMPLEADO -- 

app.post('/recarga', (req, res) => {
    let identificador = req.body.boleta;
    let saldo = parseFloat(req.body.recarga);
    let recarga = 0;

    con.query('select credito from musuario where boleta=' + identificador + '', (err1, respuesta1, fields1) => {
        if (err1) {
            console.log("ERROR", err1);
        } else {
            console.log(`El saldo actual es: ${respuesta1[0].credito}`)
            recarga = respuesta1[0].credito + saldo;
        }

        console.log(`El saldo a actualizar es: ${recarga}`)

        con.query('update musuario set credito=' + recarga + ' where boleta=' + identificador + '', (err, respuesta, fields) => {
            if (err) return console.log("ERROR", err);

            return res.redirect('/recargar')
        })
    })
})

app.post('/crearmenu', (req, res) => {
    let nom_entrada = req.body.entrada;
    let desc_entrada = req.body.desc_entrada;

    let nom_plato = req.body.plato_fuerte;
    let desc_plato = req.body.desc_plato;

    let nom_postre = req.body.postre;
    let desc_postre = req.body.desc_postre;

    let nom_bebida = req.body.bebida;
    let desc_bebida = req.body.desc_bebida;

    let precio_menu = req.body.precio_menu;
    let hora_inicio = req.body.hora_inicio;
    let hora_final = req.body.hora_final;

    con.query('update dmenudia set nombre_menu="' + nom_entrada + '", descripcion_menu="' + desc_entrada + '" where id_dmenudia=1', (err, respuesta, fields) => {
        if (err) return console.log("Error", err);

        con.query('update dmenudia set nombre_menu="' + nom_plato + '", descripcion_menu="' + desc_plato + '" where id_dmenudia=2', (err, respuesta, fields) => {
            if (err) return console.log("Error", err);

            con.query('update dmenudia set nombre_menu="' + nom_postre + '", descripcion_menu="' + desc_postre + '" where id_dmenudia=3', (err, respuesta, fields) => {
                if (err) return console.log("Error", err);

                con.query('update dmenudia set nombre_menu="' + nom_bebida + '", descripcion_menu="' + desc_bebida + '" where id_dmenudia=4', (err, respuesta, fields) => {
                    if (err) return console.log("Error", err);

                    con.query('update mmenudia set precio_menu=' + precio_menu + ', hora_inicio="' + hora_inicio + '", hora_final="' + hora_final + '" where id_mmenudia=1', (err, respuesta, fields) => {
                        if (err) return console.log("Error", err);

                        return res.redirect('/menudia')
                    })
                })
            })
        })
    })

})


app.listen(process.env.PORT || 8080, (req, res) => {
    console.log('Escuchando desde el puerto 8080')
})