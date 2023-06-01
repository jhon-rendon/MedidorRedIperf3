let mysql  = require('mysql');
const { data_conection } = require(__dirname+'/config.json');

let connection = null;

const dbConnection = async() => { 
     connection =  mysql.createConnection({
        host:  data_conection.host,
        user:  data_conection.user,
        password:  data_conection.password,
        database: data_conection.database
    });


  connection.connect(function(err) {
        if (err) {
            //console.error('error connecting: ' + err.stack);
            console.log("Error al establecer la conexión a la BD -- " + err.stack); 
            throw err;
            return;
        }
        console.log("Conexión exitosa a la base de datos"); 

    });

    return connection;
}


 //Cerrar la conexión
 const closeConnection = async() => { 
  await connection.end(function(){
      // La conexión se ha cerrado
      console.log("La conexión se ha cerrado");
  });
}



  
 const getPuntos = async () => {
    
   //await dbConnection();
    return new Promise((resolve, reject)=>{
      
      connection.query('SELECT * FROM  puntos order by  zona,nombre ',  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log('Listado Puntos de venta - Cantidad '+rows.length);
          return resolve(rows);
        
      });
      //closeConnection();
  });
  };

  const getCategorias = async () => {
    return new Promise((resolve, reject)=>{
      connection.query('SELECT * FROM tipo_actualizacion GROUP BY categoria order by categoria ',  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log('Listado Categorias - Cantidad '+rows.length);
          return resolve(rows);
      });
  });
  };

  const getUltimoIDRegistroByIP = async ( ip ) => {
    return new Promise((resolve, reject)=>{
      connection.query("SELECT max(ID) id FROM registro WHERE PUNTOS_IP = '"+ip+"'",  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log('Ultimo ID ('+rows[0]['id']+') registrado con la IP  '+ip);
          return resolve(rows);
      });
  });
  };


  const insertRegistro = async ( ip, categoria,horaInicio,rutaDestino,tamanioArchivo,observacion ) => {
    return new Promise((resolve, reject)=>{
      let sql = "INSERT INTO actualizador.registro (PUNTOS_IP, TIPO_ACTUALIZACION_ID, FECHA,HORA_INICIO, ESTADO,RUTA,TAMANIO_TOTAL ,OBSERVACION) VALUES ('"+ip+"', '"+categoria+"', NOW(), '"+horaInicio+"', 'Procesando','"+rutaDestino+"','"+tamanioArchivo+"','"+observacion+"')";
      connection.query(sql,  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log("Registro Satisfactorio");
          return resolve(true);
      });
  });
  };

  const updateRegistro = async ( id, ip ,horaFinal,estado,tamanioParcial,porcentaje,error='' ) => {
    return new Promise((resolve, reject)=>{
     let sql = `UPDATE actualizador.registro 
                SET HORA_FIN = '${horaFinal}',estado='${estado}',error='${error}',TAMANIO_PARCIAL='${tamanioParcial}',
                    PORCENTAJE = '${porcentaje}'
               WHERE PUNTOS_IP = '${ip}' AND id ='${id}'`;
      connection.query(sql,  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log("Actualización Satisfactoria");
          return resolve(true);
      });
  });
  };



  const insertRegistroMedidor = async ( fecha,hora,ip, transEnv, bitraEnv, transRec, bitraERec , ipserver, puerto , zona_server) => {
    return new Promise((resolve, reject)=>{
      
    let sql = "INSERT INTO actualizador.medidor (FECHA, HORA, IP, TRANFER_ENV, BITRATE_ENV, TRANFER_REC, BITRATE_REC , IP_SERVER, PUERTO_SERVER, ZONA_SERVER)  VALUES ( STR_TO_DATE( '"+fecha+"', '%d/%m/%Y'), '"+hora+"', '"+ip+"', '"+transEnv+"', '"+bitraEnv+"', '"+transRec+"','"+bitraERec+"','"+ipserver+"','"+puerto+"','"+zona_server+"')";
            connection.query(sql,  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log(sql);
          console.log("Registro Satisfactorio");
          return resolve(true);
      });
  });
  };


  const getRegistrosMedidor = async ( fechaInicial, fechaFinal) => {
    return new Promise((resolve, reject)=>{
      connection.query(`SELECT
            puntos.IP, 
            puntos.NOMBRE, 
            puntos.ZONA, 
            date_format( medidor.FECHA, '%d/%m/%Y')  FECHA, 
            medidor.HORA, 
            medidor.TRANFER_ENV, 
            medidor.BITRATE_ENV, 
            medidor.TRANFER_REC, 
            medidor.BITRATE_REC,
            medidor.IP_SERVER,
            medidor.PUERTO_SERVER,
            medidor.ZONA_SERVER
            
        FROM
            puntos,
            medidor
        WHERE
      puntos.IP = medidor.IP 
      AND fecha BETWEEN STR_TO_DATE( '${fechaInicial}', '%d/%m/%Y') and STR_TO_DATE( '${fechaFinal}', '%d/%m/%Y')
      `,  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log('Listado de registros Medidor - Cantidad '+rows.length);
       
          return resolve(rows);
      });
  });
  };


  const getServidorMedidor = async () => {
    return new Promise((resolve, reject)=>{
      connection.query(` SELECT IP,PUERTO,ZONA,DESCRIPCION FROM servidor_medidor`,  (error, rows)=>{
          if(error){
              return reject(error);
          }
          console.log('Listado de registros SERVIDOR MEDIDOR - Cantidad '+rows.length);
          return resolve(rows);
      });
  });
  };






 


  dbConnection();


  module.exports = {
   getPuntos,
   getCategorias,
   getUltimoIDRegistroByIP,
   insertRegistro,
   updateRegistro,
   insertRegistroMedidor,
   getRegistrosMedidor,
   getServidorMedidor
 } 