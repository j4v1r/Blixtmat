var express = require('express');
var app = express();

const bodyParser = require('body-parser');

const session = require('express-session');

// -- Inicio de sesión con Google -- 
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const GOOGLE_CLIENT_ID = '173992933976-ku8apq4lvfsr988jjqav3fln4rk5aupb.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';


// -- MySQL --
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'Alejandro';
const DB_PASSWORD = process.env.DB_PASSWORD || 'gl0rfInd3#';
const DB_NAME = process.env.DB_NAME || 'blixtmat';
const DB_PORT = process.env.DB_PORT || 3306;

const mysql = require('mysql2');

var con = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT
})

con.connect();

// -- Motor de vistas -- 
app.set('view engine', 'ejs');

app.use(express.json());
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/public'))


// -- Inicio de sesión Google -- 

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/google/callback",
    passReqToCallback: true
},
    function (request, response, accessToken, refreshToken, profile, done) {
        const id = profile.id;
        const email = profile.emails[0].value;
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName;
        const profilePhoto = profile.photos[0].value;
        const source = "google";
        const fecha = "2005-06-11";
        const boleta = 4545;

        console.log(email);
        con.query('select * from musuario where nombre_usuario="' + email + '"', (err, respuesta, fields) => {
            console.log(respuesta.length)
            console.log(`La contraseña es ${respuesta[0].password}`)
            if (err) {
                console.log('ERROR', err)
            } else if (respuesta.length == 0) {
                con.query('INSERT into musuario (nombre_persona, apellido_persona, fecha_nacimiento, boleta, nombre_usuario, password, id_cusuario) values ("' + firstName + '", "' +
                    lastName + '", "' + fecha + '", "' + boleta + '","' + email + '", "' + source + '",1)', (err1, respuesta1, fields1) => {
                        if (err1) {
                            console.log('Error', err1)
                        } else {
                            return done(null, respuesta1)
                        }

                    });
            } else if (respuesta.length == 1) {
                return done(null, respuesta)
            } else {
                return ('/')
            }

        })
    }
));

passport.serializeUser(function (user, done) {
    console.log(user[0].nombre_persona)
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    console.log(user)
    done(null, user);
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
)

app.get('/google/callback',
    passport.authenticate('google', {
        successRedirect: '/menudia',
        failureRedirect: '/auth/failure',
    })
);

app.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.session.destroy();
        res.redirect('/')
    })
});

app.get('/auth/failure', (req, res) =>
    res.send('Something went wrong')
)




// -- Inicio y registro de Sesión con BD -- 

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

app.post('/iniciarSesion', (req, res) => {
    let username = req.body.usuario;
    let password = req.body.contrasena;

    console.log(`El username es ${username} y contraseña ${password}`)

    if (username && password) {
        con.query('select * from musuario where nombre_usuario = ? and password = ?', [username, password], (err, respuesta, fields) => {
            if (err) return console.log("Error inicio de sesión", err)

            if (respuesta.length > 0) {
                console.log(respuesta[0].id_musuario)
                req.session.logged = true;
                req.session.username = username;
                req.session.tipo = respuesta[0].id_cusuario;
                req.session.id_musuario = respuesta[0].id_musuario;
                console.log(req.session.tipo)
                console.log(req.session.id_musuario)
                res.redirect('/menudia')
            } else {
                res.send('USUARIO Y CONT EQUIVOCADOS');
            }
            res.end();
        })
    } else {
        res.send('Ingresa Usuario y contraseña');
        res.end();
    }
})

app.get('/cerrarSesion', (req, res) => {
    req.session.destroy();
    console.log('Sesion cerrada')
    res.redirect('/')
})




// ----------------------------- RENDERS ----------------------------- //




// -- Renders GENERAL -- 

app.get('/', (req, res) => {

    if (req.isAuthenticated()) {
        con.query('select * from vistamenu', (err, respuesta, fields) => {
            if (err) {
                console.log("Error", err)
            } else {
                console.log(respuesta);
                res.render('pages/menudeldia', { entrada: respuesta[0], plato: respuesta[1], postre: respuesta[2], bebida: respuesta[3], tipo: req.user[0].id_cusuario })
            }
        })
    } else if (req.session.logged) {
        con.query('select * from vistamenu', (err, respuesta, fields) => {
            if (err) {
                console.log("Error", err)
            } else {
                console.log(respuesta);
                res.render('pages/menudeldia', { entrada: respuesta[0], plato: respuesta[1], postre: respuesta[2], bebida: respuesta[3], tipo: req.session.tipo })
            }
        })

    } else {
        res.render('pages/inicioSesion')
    }
})

app.get('/about', (req, res) => {
    res.render('pages/registro');
})

app.get('/menudia', (req, res) => {

    if (req.isAuthenticated()) {
        con.query('select * from vistamenu', (err, respuesta, fields) => {
            if (err) {
                console.log("Error", err)
            } else {
                console.log(respuesta);
                res.render('pages/menudeldia', { entrada: respuesta[0], plato: respuesta[1], postre: respuesta[2], bebida: respuesta[3], tipo: req.user[0].id_cusuario, id: req.user[0].id_musuario })
            }

        })
    } else if (req.session.logged) {
        con.query('select * from vistamenu', (err, respuesta, fields) => {
            if (err) {
                console.log("Error", err)
            } else {
                console.log(respuesta);
                res.render('pages/menudeldia', { entrada: respuesta[0], plato: respuesta[1], postre: respuesta[2], bebida: respuesta[3], tipo: req.session.tipo, id: req.session.id_musuario })
            }

        })

    } else {
        res.render('pages/inicioSesion')
    }

})

app.get('/productos', (req, res) => {


    if (req.isAuthenticated()) {

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

    } else if (req.session.logged) {

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

    } else {
        res.render('pages/inicioSesion')
    }

})

app.get('/inventario', (req, res) => {
    res.render('pages/inventario')
})

app.get('/desc_producto/:id', (req, res) => {

    if (req.isAuthenticated()) {

        let id_mproducto = req.params.id;
        console.log(id_mproducto)
        con.query('select * from mproducto where id_mproducto=' + id_mproducto + '', (err, respuesta1, fields) => {
            if (err) {
                console.log('Error', err)
            } else {
                console.log(respuesta1)
                res.render('pages/descripcion_producto', { respuesta1: respuesta1, tipo: req.user[0].id_cusuario })
            }

        })

    } else if (req.session.logged) {

        let id_mproducto = req.params.id;
        console.log(id_mproducto)
        con.query('select * from mproducto where id_mproducto=' + id_mproducto + '', (err, respuesta1, fields) => {
            if (err) {
                console.log('Error', err)
            } else {
                console.log(respuesta1)
                res.render('pages/descripcion_producto', { respuesta1: respuesta1, tipo: req.session.tipo })
            }

        })

    } else {
        res.render('pages/inicioSesion')
    }

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

    if (req.isAuthenticated() && req.user[0].id_cusuario > 1) {

        con.query('select * from vistamenu', (err, respuesta, fields) => {
            if (err) {
                console.log('Error', err)
            } else {
                console.log(respuesta)
                res.render('pages/crearmenu', { entrada: respuesta[0], plato: respuesta[1], postre: respuesta[2], bebida: respuesta[3] });
            }
        })

    } else if (req.session.logged && req.session.tipo > 1) {

        con.query('select * from vistamenu', (err, respuesta, fields) => {
            if (err) {
                console.log('Error', err)
            } else {
                console.log(respuesta)
                res.render('pages/crearmenu', { entrada: respuesta[0], plato: respuesta[1], postre: respuesta[2], bebida: respuesta[3] });
            }
        })

    } else if (req.session.logged && req.session.tipo == 1 || req.isAuthenticated() && req.user[0].id_cusuario == 1) {

        res.redirect('/menudia')
    } else {
        res.render('pages/inicioSesion')
    }

})

app.get('/recargar', (req, res) => {

    if (req.isAuthenticated() && req.user[0].id_cusuario > 1) {

        res.render('pages/recarga')

    } else if (req.session.logged && req.session.tipo > 1) {

        res.render('pages/recarga')

    } else if (req.session.logged && req.session.tipo == 1 || req.isAuthenticated() && req.user[0].id_cusuario == 1) {

        res.redirect('/menudia')
    } else {

        res.render('pages/inicioSesion')
    }
})

app.get('/productosEmp', (req, res) => {


    if (req.isAuthenticated() && req.user[0].id_cusuario > 1) {

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

    } else if (req.session.logged && req.session.tipo > 1) {

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

    } else if (req.session.logged && req.session.tipo == 1 || req.isAuthenticated() && req.user[0].id_cusuario == 1) {

        res.redirect('/menudia')
    } else {

        res.render('pages/inicioSesion')
    }

})

app.get('/agregarProducto', (req, res) => {

    if (req.isAuthenticated() && req.user[0].id_cusuario > 1) {

        con.query('select * from csubproducto where id_csubproducto>4', (err, respuesta, fields) => {
            if (err) {
                console.log('Error', err)
            } else {
                console.log(respuesta)
                res.render('pages/crearProducto', { respuesta: respuesta })
            }
        })


    } else if (req.session.logged && req.session.tipo > 1) {

        con.query('select * from csubproducto where id_csubproducto>4', (err, respuesta, fields) => {
            if (err) {
                console.log('Error', err)
            } else {
                console.log(respuesta)
                res.render('pages/crearProducto', { respuesta: respuesta })
            }
        })

    } else if (req.session.logged && req.session.tipo == 1 || req.isAuthenticated() && req.user[0].id_cusuario == 1) {

        res.redirect('/menudia')
    } else {

        res.render('pages/inicioSesion')
    }

})

app.get('/editarProducto/:id', (req, res) => {

    if (req.isAuthenticated() && req.user[0].id_cusuario > 1) {

        let id_mproducto = req.params.id;

        con.query('select * from vistaProducto where id_mproducto=' + id_mproducto + '', (err, respuesta, fields) => {
            if (err) {
                console.log('Error', err)
            } else {
                console.log(respuesta)
                con.query('select * from csubproducto where id_csubproducto>4', (err1, respuesta1, fields1) => {
                    if (err1) {
                        console.log('Error', err1)
                    } else {
                        console.log(respuesta1)
                        res.render('pages/editar_producto', { respuesta: respuesta, respuesta1: respuesta1 })
                    }
                })

            }
        })

    } else if (req.session.logged && req.session.tipo > 1) {

        let id_mproducto = req.params.id;

        con.query('select * from vistaProducto where id_mproducto=' + id_mproducto + '', (err, respuesta, fields) => {
            if (err) {
                console.log('Error', err)
            } else {
                console.log(respuesta)
                con.query('select * from csubproducto where id_csubproducto>4', (err1, respuesta1, fields1) => {
                    if (err1) {
                        console.log('Error', err1)
                    } else {
                        console.log(respuesta1)
                        res.render('pages/editar_producto', { respuesta: respuesta, respuesta1: respuesta1 })
                    }
                })

            }
        })

    } else if (req.session.logged && req.session.tipo == 1) {

        res.redirect('/menudia')
    } else {

        res.render('pages/inicioSesion')
    }

})




// -- Renders CLIENTE -- 

app.get('/confirmar')

app.get('/perfil', (req, res) => {

    if (req.isAuthenticated()) {
        let id = req.user[0].id_musuario;
        con.query('select * from musuario where id_musuario=' + id + '', (err, respuesta, fields) => {
            if (err) {
                console.log("Error", err)
            } else {
                console.log(respuesta);
                res.render('pages/perfilCliente', { respuesta: respuesta[0], id: req.user[0].id_musuario })
            }

        })
    } else if (req.session.logged) {
        let id = req.session.id_musuario;
        con.query('select * from musuario where id_musuario=' + id + '', (err, respuesta, fields) => {
            if (err) {
                console.log("Error", err)
            } else {
                console.log(respuesta[0].fecha_nacimiento);
                res.render('pages/perfilCliente', { respuesta: respuesta[0], id: req.session.id_musuario })
            }

        })

    } else {
        res.render('pages/inicioSesion')
    }


})



// ----------------------------- FUNCIONALIDADES ----------------------------- //



// -- Funciones del CLIENTE -- 

app.get('/ordenarMenu/:id/:id_menu', (req, res) => {

    let id_musuario = req.params.id;
    let id_mmenu = req.params.id_menu;
    let date_ob = new Date();

    // current day
    let date = parseInt(("0" + date_ob.getDate()).slice(-2));
    console.log(date, typeof date)

    // current month
    let month = parseInt(("0" + (date_ob.getMonth() + 1)).slice(-2));
    console.log(month, typeof month)

    // current year
    let year = date_ob.getFullYear();
    console.log(year, typeof year)

    // current hours
    let hours = date_ob.getHours();
    console.log(hours)

    // current minutes
    let minutes = date_ob.getMinutes();
    console.log(minutes)

    // current seconds
    let seconds = date_ob.getSeconds();
    console.log(seconds)

    console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);

    con.query('select * from mcompra where id_musuario=' + id_musuario + ' and id_cedocompra=2 order by id_mcompra desc', (err, respuesta, fields) => {

        console.log(respuesta)
        let fecha = JSON.stringify(respuesta[0].fecha_mcompra)
        console.log(fecha)
        let horas = respuesta[0].hora_mcompra;

        let ano = parseInt(fecha.charAt(1) + fecha.charAt(2) + fecha.charAt(3) + fecha.charAt(4));
        console.log(ano, typeof ano)
        let mes = parseInt(fecha.charAt(6) + fecha.charAt(7));
        console.log(mes, typeof mes)
        let dia = parseInt(fecha.charAt(9) + fecha.charAt(10));
        console.log(dia, typeof dia)


        let hora = parseInt(horas.charAt(0) + horas.charAt(1));
        console.log(hora, typeof hora)
        let minuto = parseInt(horas.charAt(3) + horas.charAt(4));
        console.log(minuto, typeof minuto)

        if (err) {
            console.log('Error', err)
        } else if ((dia == date && mes == month && ano == year && hora == hours && minutes - minuto <= 5) || (dia == date && mes == month && ano == year && hora == hours && minuto == minutes) || (dia == date && mes == month && ano == year && hours - hora == 1 && minuto - minutes >= 55)) {
            console.log('Ha habido un intento de compra en los ultimos 5 minutos')
            con.query('insert into dcarrito (cant_producto, id_mproducto) values (1, 1)', (err1, respuesta1, fields1) => {
                if (err1) {
                    console.log('Error1', err1)
                } else {
                    con.query('insert into ecarrito (id_dcarrito, id_mcompra) values (LAST_INSERT_ID(), ' + respuesta[0].id_mcompra + ')', (err2, respuesta2, fields2) => {
                        if (err2) {
                            console.log('Error2', err2)
                        } else {
                            res.redirect('/menudia')
                        }
                    })
                }
            })
        } else if ((dia == date && mes == month && ano == year && hora == hours && minutes - minuto > 5) || (dia == date && mes == month && ano == year && hours - hora == 1 && minuto - minutes < 55) || dia != date) {
            console.log('NO ha habido un intento de compra en los ultimos 5 minutos')
            let fecha_actual = year + "-" + month + "-" + date;
            let hora_actual = hours + ":" + minutes + ":" + seconds;
            con.query('insert into mcompra (fecha_mcompra, id_cedocompra, id_musuario, hora_mcompra) values ("' + fecha_actual + '", 2, ' + id_musuario + ', "' + hora_actual + '")', (err3, respuesta3, fields3) => {
                console.log(respuesta3.insertId);
                if (err3) {
                    console.log('Error3', err3)
                } else {
                    let id_mcompra = respuesta3.insertId;
                    console.log(id_mcompra, typeof id_mcompra);
                    con.query('insert into dcarrito (cant_producto, id_mproducto) values (1, 1)', (err5, respuesta5, fields5) => {
                        if (err5) {
                            console.log('Error5', err5)
                        } else {
                            con.query('insert into ecarrito (id_dcarrito, id_mcompra) values (LAST_INSERT_ID(), ' + id_mcompra + ')', (err6, respuesta6, fields6) => {
                                if (err6) {
                                    console.log('Error6', err6)
                                } else {
                                    res.redirect('/menudia')
                                }
                            })
                        }
                    })


                }
            })
        }
    })

})

app.post('/actualizarUsuario', (req, res) => {

    let id_musuario = req.body.id_musuario;
    let nombre_persona = req.body.nombre;
    let apellido_persona = req.body.app;
    let boleta = req.body.boleta;
    let nom_user = req.body.nom_user;
    let contrasena = req.body.password;

    con.query('update musuario set nombre_persona="' + nombre_persona + '", apellido_persona="' + apellido_persona + '", boleta=' + boleta + ', nombre_usuario="' + nom_user + '", password="' + contrasena + '" where id_musuario='+id_musuario+'', (err, respuesta, fields) => {
        if(err){
            console.log('Error', err)
        }else{
            res.redirect('/perfil')
        }
    })



})




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

app.get('/borrarProducto/:id', (req, res) => {

    let id_mproducto = req.params.id;

    con.query('delete from mproducto where id_mproducto=' + id_mproducto + '', (err, respuesta, field) => {
        if (err) {
            console.log('Error', err)
        } else {
            console.log('Delete exitoso')
            res.redirect('/productosEmp')
        }
    })

})

app.post('/agregarProducto', (req, res) => {

    let nom_producto = req.body.nom_producto;
    let precio_producto = req.body.precio_producto;
    let desc_producto = req.body.desc_producto;
    let tipo_producto = req.body.tipo_producto;
    let imagen = req.body.link_imagen;

    con.query('insert into mproducto (nombre_producto, precio_producto, id_csubproducto, descripcion) values ("' + nom_producto + '", ' + precio_producto + ', ' + tipo_producto + ', "' + desc_producto + '")',
        (err, respuesta, fields) => {
            if (err) {
                console.log('Error', err)
            } else {
                console.log('Registro producto')
                res.redirect('/productosEmp')
            }
        })

})

app.post('/editarProducto', (req, res) => {

    let id_mproducto = req.body.id_mproducto;
    let nom_producto = req.body.nom_producto;
    let precio_producto = req.body.precio_producto;
    let desc_producto = req.body.desc_producto;
    let tipo_producto = req.body.tipo_producto;
    let imagen = req.body.link_imagen;

    con.query('update mproducto set nombre_producto="' + nom_producto + '", precio_producto=' + precio_producto + ', descripcion="' + desc_producto + '", id_csubproducto=' + tipo_producto + ' where id_mproducto=' + id_mproducto + '',
        (err, respuesta, fields) => {
            if (err) {
                console.log('Error', err)
            } else {
                res.redirect('/productosEmp')
            }
        })

})





app.listen(process.env.PORT || 8080, (req, res) => {
    console.log('Escuchando desde el puerto 8080')
})
