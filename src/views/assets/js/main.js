const fs            = require("fs");
const { NodeSSH }   = require('node-ssh')
let $               = require( "jquery" );
let ping            = require('ping');
require( 'datatables.net' )( window, $ );

const { getPuntos,getCategorias,
        getUltimoIDRegistroByIP,
        insertRegistro,
        updateRegistro,
        insertRegistroMedidor,
        getRegistrosMedidor,
        getServidorMedidor
      } = require(__dirname+'/assets/js/database.js');

const { data_ftp_ssh, data_rutas_app, data_vnc } = require(__dirname+'/assets/js/config.json');


const listServer = async () => {

  let getServer = await getServidorMedidor();
  if( getServer.length > 0 ){


    for ( let i=0; i<getServer.length;i++ ) {
 
      let dirIp  = $.trim( getServer[i]['IP']);
      let puerto = $.trim( getServer[i]['PUERTO'] ); 
      let zona   = $.trim( getServer[i]['ZONA'] ); 

      $("#server").append(` <option value='${dirIp}-${puerto}-${zona}'>${dirIp} ${puerto} ${zona}</option>`);
    }
    
  }
  $("#server").attr("disabled",false);
}

const tableListarPuntos = async () => {
  let getPDV =  await getPuntos();
  
  if( getPDV.length > 0 ){

    let bodyTablePDV    = document.getElementById("listadoPDV");
    let estadoPing      = "";
    let countReg        = getPDV.length;
    let porcentaje      = 0; 
    let countCarga      = 0;
    let divProgressBar  = $("#cargaPuntos");

   for ( let i=0; i<getPDV.length;i++ ) {
 
     let dirIp    = $.trim( getPDV[i]['IP']);
     let nombre   = $.trim( getPDV[i]['NOMBRE'] ); 
     let zona     = $.trim( getPDV[i]['ZONA'] ); 
     let conexion = $.trim( getPDV[i]['CONEXION'] ); 

     
      ping.sys.probe(dirIp, async function( isAlive ){
        estadoPing = isAlive ? ' <span class="btn btn-success estado">ON</span>':'  <span class="btn btn-danger">OFF</span>'
        let disabled ="";

       if( !isAlive ){
          disabled = "disabled";
       }   
 
       bodyTablePDV.innerHTML+=` <tr>
                                    <td class='estado'>${estadoPing}</td>
                                    <td class='dirIP'>${dirIp}</td>
                                    <td>${zona}</td> 
                                    <td>${nombre}</td> 
                                    <td>${conexion}</td>
                                    <!--<td class='horaInicio'></td>
                                    <td class='horaFinal'></td>-->
                                    <td >
                                    
                                      <!--<button class='btn btn-info btnFtp' data-ip='${dirIp}' data-pdv='${nombre}' ${disabled}  onclick='enviarArchivo(event)'> Transferir </button>
                                      <button class='btnHV btn btn-warning' data-ip='${dirIp}' data-pdv='${nombre}' ${disabled} onclick='getHVPDV(event)'>HV</button>
                                      <button class='btn btn-danger btnCerrarPos' data-ip='${dirIp}' data-pdv='${nombre}' ${disabled} onclick='closePosslim(event)'>Pos</button>
                                      -->
                                      <button class='btn btnVNC' style='background:#8ED694' data-ip='${dirIp}' data-pdv='${nombre}' ${disabled} onclick='openVNC(event)'>VNC</button>
                                      <button class='btn btnPutty' style='background:#2a2828;color:white;' data-ip='${dirIp}' data-pdv='${nombre}' ${disabled} onclick='openPutty(event)'>Putty</button>
                                    
                                    
                                    <button class='btn btn-info btnIperf3' data-ip='${dirIp}' data-pdv='${nombre}' data-zona='${zona}' ${disabled} onclick='iperf3(event)'>IperF3</button>
                                    <div class="spinner-grow text-secondary load" role="status" style="display:none !important;font-size:11px;">
                                    </div>
                                    
                                    <!--<div class='progress'>
                                    <div class='progress-bar'  role='progressbar' style='width:0%;' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100'>0%</div>
                                    </div>-->
                                    </td>
                                    <!--<td>
                                    <div class='progress'>
                                    <div class='progress-bar'  role='progressbar' style='width:0%;' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100'>0%</div>
                                    </div>
                                    <span class='reconexion' style='font-size:10px;'></span>
                                    </td>-->
                           
                                </tr>`;

                           countCarga++;
                           porcentaje = (( countCarga / countReg )*100).toFixed(0);
                           divProgressBar.width(porcentaje+'%');
                           divProgressBar.text(porcentaje+"%");
                           $("#cantidad").text(countCarga);
                           

                           if( divProgressBar.text() =='100%' ){
                            $("#iperf3Todo").attr("disabled",false); //Habilitar Boton Transferir Todo
                            $("#tablePDV").DataTable({
                              "paging": false
                            });
                              await listServer();
                           }
            
    });//Fin PING
   
   }//fin for

 

  }//fin if

}//Fin funcion tableListarPuntos


const getListCatgorias = async () => {

  let getCat =  await getCategorias();
  
  if( getCat.length > 0 ){

    for ( let i=0; i<getCat.length;i++ ){
      $("#categoria").append("<option value='"+getCat[i]['ID']+"'>"+getCat[i]['CATEGORIA']+"</option>");
    }//fin for
  }//fin if 

};//Fin funcion getListCatgorias




let rutaOrigen = "";
$("#rutaOrigen").change(function(e){

  rutaOrigen  = $.trim( document.getElementById("rutaOrigen").files[0].path );
  rutaOrigen  = String(rutaOrigen).replace(/\\/g, "/");
  
  let arrRutaOrigen = rutaOrigen.split('/');
  $("#rutaDestino").val('/home/gamble/prueba-ftp/'+arrRutaOrigen[ (arrRutaOrigen.length -1)]);
  
});




const validPing = () => {

  console.log('validPing ');
  let dirIp      = null;
  let estadoPing = "";
  let disabled   = false;

  $("#listadoPDV > tr").each(function( index, tr ){
    dirIp = $.trim( $(tr).find('td.dirIP').text() );
    
    ping.sys.probe(dirIp, function(isAlive){
      estadoPing = isAlive ? ' <span class="btn btn-success estado">ON</span>':'  <span class="btn btn-danger">OFF</span>'
      disabled   = false;
      if( !isAlive ){
         disabled = true;
      }  
      $(tr).find('td.estado').html(estadoPing);
      $(tr).find('td').children('.btnFtp').attr('disabled',disabled);
      $(tr).find('td').children('.btnHV').attr('disabled',disabled);
      $(tr).find('td').children('.btnVNC').attr('disabled',disabled);
      $(tr).find('td').children('.btnPutty').attr('disabled',disabled);
      $(tr).find('td').children('.btnCerrarPos').attr('disabled',disabled);
      $(tr).find('td').children('.btnIperf3').attr('disabled',disabled);


                                      
       
   });

  });
}


let cantidadIntentosReconexionPermitidos = data_ftp_ssh.intentosPermitidos;

const enviarArchivo = async ( event ) => {
 
  let  obj                = event.target;
  let  horaInicio         = new Date().toLocaleTimeString();
  let  ipPDV              = $.trim( $(obj).data("ip") );
  let  nombrePDV          = $.trim( $(obj).data("pdv") );
  let  categoriaArchivo   = $("#categoria option:selected").val();
  let  rutaDestino        = $.trim( $("#rutaDestino").val() );
  let  observacion        = $.trim( $("#observacion").val() );
  let  porcentaje         = 0;
  let  totalTransferido   = 0;
  let  intentosReconexion = 1;
  let  estadoTransferencia= false;
  let  ultimoIDByIP       = null;
  let  idsetInterval      = null;
  let  insertReg          = false;

  $(obj).attr('disabled', true);
  
  
  if( rutaDestino !="" && rutaOrigen!="" ){

    /*if( !confirm("Realmente desea transferir el archivo ?") ){
      $(obj).attr('disabled', false);
      return;
    }*/
    
    $(obj).attr('disabled', true);
    const {size}       = fs.statSync(rutaOrigen);
    let tamanioArchivo = (size/1048576).toFixed(2);
       const ssh = new NodeSSH();

        const ConectarSSH = async () => {
        await ssh.connect ({
            host: ipPDV,
            username: data_ftp_ssh.user,
            password: data_ftp_ssh.password,
            port: data_ftp_ssh.port,
            readyTimeout: data_ftp_ssh.tiempoReconexion
          })
          .then( async function() {
            
            horaInicio = new Date().toLocaleTimeString();
            $(obj).attr('disabled', true);
            $(obj).parent().parent().find('td.horaInicio').text(horaInicio);
            $(obj).parent().parent().find('td.horaFinal').text("");
            $(obj).parent().next().find(".progress-bar").css('background', '#5ea0c4'); //Azul
          
            intentosReconexion = 1;
            $(obj).parent().next().find(".reconexion").html('');

            if( !insertReg ){
              if( insertRegistro( ipPDV, categoriaArchivo,horaInicio,rutaDestino,tamanioArchivo,observacion) ){
                ultimoIDByIP = await getUltimoIDRegistroByIP(ipPDV);
                ultimoIDByIP = ultimoIDByIP[0]['id'];
                insertReg = true;
              } 
            }
            console.log('Transfiriendo Archivo');    
            ssh.putFile(rutaOrigen, rutaDestino, undefined, {
                step: (total_transferred, chunk, total) => {
                    totalTransferido = (total_transferred/1048576).toFixed(2);
                    porcentaje = ( (total_transferred/total)*100 ).toFixed(0);
                    if( porcentaje <=100){
                        $(obj).parent().next().find(".progress-bar").width(porcentaje+'%');
                        $(obj).parent().next().find(".progress-bar").text(porcentaje+"%");
                    }
                }
            }).then( async(data) => {
              // success
              let horaFinal = new Date().toLocaleTimeString();
              if( ultimoIDByIP ){
                 await updateRegistro( ultimoIDByIP, ipPDV ,horaFinal,"Finalizado",totalTransferido,porcentaje );
              }
            
              console.log("Archivo Cargado Satisfactoriamente en el punto de venta "+nombrePDV+" con IP "+ipPDV);
    
              $(obj).parent().next().find(".progress-bar").css('background', '#49af85'); //Azul
              $(obj).attr('disabled', false);
              $(obj).parent().parent().find('td.horaFinal').text(horaFinal);
              $(obj).attr('disabled', false);

              estadoTransferencia = true;
              clearInterval(idsetInterval); // Finalizar Interval

              ssh.dispose();
        
            }).catch( async(error) => {
              // error
              console.log('error al transferir');
              console.log(error);
            });
    
          $(obj).attr('disabled', false);
          //ssh.dispose();
      }).catch( (error) => {
        console.log('Error al Conectar PoR ssh EN LA ip '+ipPDV+" "+error);
      });

    }

    await ConectarSSH();
   // console.log(ssh);

      // Reintentos
      if( intentosReconexion <= cantidadIntentosReconexionPermitidos ){

        idsetInterval = setInterval(async function() {
          if( intentosReconexion <= cantidadIntentosReconexionPermitidos ){
            if (await !ssh.isConnected() ) {
              $(obj).parent().next().find(".progress-bar").css('background', '#d5d154');//Amarillo
              $(obj).parent().next().find(".reconexion").html('Intento Reconexión '+intentosReconexion);
              ConectarSSH();
              console.log('Intento de Reconexión # '+intentosReconexion);
              intentosReconexion++ ;
              
            }
          }
          else if( intentosReconexion > cantidadIntentosReconexionPermitidos &&  !estadoTransferencia ){
            //Finalizar 
            console.log("Finalizar transferencia incompleta ");
            $(obj).parent().next().find(".progress-bar").css('background', '#f7462a');//Rojo
            let horaFinal = new Date().toLocaleTimeString();
            if( ultimoIDByIP ){
                console.log("Trasnferencia Incompleta ");
                await updateRegistro( ultimoIDByIP, ipPDV ,horaFinal,"Incompleto",totalTransferido,porcentaje,"Error de conexión" );
            }
            clearInterval(idsetInterval);
            ssh.dispose();
            $(obj).attr('disabled', false);
            intentosReconexion = 1;
          }
        }, data_ftp_ssh.tiempoReconexion)
      }



  }else{
     //alert('Especifique la ruta de origen y destino');
     $("#modalBody").html("Debe Selecciconar la ruta de origen y destino");
     let myModal = new bootstrap.Modal(document.getElementById('modal'), {
       keyboard: false
     });
     myModal.show();
  }

   $(obj).attr('disabled',false);


}


let myModal = new bootstrap.Modal(document.getElementById('modal'), {
  keyboard: false
});
const getHVPDV = ( event ) =>{

  const ssh = new NodeSSH();

  let  obj                = event.target;
  let  ipPDV              = $.trim( $(obj).data("ip") );
  let  nombrePDV          = $.trim( $(obj).data("pdv") );

   ssh.connect ({
      host: ipPDV,
      username: data_ftp_ssh.user,
      password: data_ftp_ssh.password,
      port: data_ftp_ssh.port,
      readyTimeout: data_ftp_ssh.tiempoReconexion
    })
    .then( async function() {

      myModal.hide();
      let  table =`<table class='table table-bordered'>
                    `;
      await  ssh.execCommand(`hostnamectl | grep "Static"`, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        table+= `<tr><th>HOSTNAME</th><td>${result.stdout}</td></tr>` ;
      });

      await ssh.execCommand(`hostnamectl | grep "Operating" `, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        table+= `<tr><th>S.O</th><td>${result.stdout}</td></tr>` ;
      });

      await ssh.execCommand(`free -m  `, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        table+= `<tr><th>MEMORIA RAM</th><td>${result.stdout}</td></tr>` ;
      });

      await ssh.execCommand(`cat /proc/cpuinfo | grep "model name" `, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        table+= `<tr><th>PROCESADOR</th><td>${result.stdout}</td></tr>` ;
      });

      await  ssh.execCommand(`echo "gamble"| sudo -S  dmidecode -t 2 | grep "Product Name" `, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        table+= `<tr><th>BOARD</th><td>${result.stdout}</td></tr>` ;
      });

      await ssh.execCommand(` cat /sys/block/sda/queue/rotational  `, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        if( result.stdout ==   0 ){
          table+= `<tr><th>DISCO DURO</th><td>Disco Solido</td></tr>`
        }else{
          table+= `<tr><th>DISCO DURO</th><td>Disco Mecánico</td></tr>`
        }
        ///com+= "<br>"+result.stdout ;
      });

      await ssh.execCommand(`cat /home/gamble/businessnet/ClientePos.sh  | grep BnetPosSlim.sh `, { cwd:'./' }).then(function(result) {
       
        table+= `<tr><th>POSSLIM</th><td>${result.stdout}</td></tr>` ;
      });


      await ssh.execCommand(`stat -c ‘%y’ /home/gamble/businessnet/6_COD_PATAMILLONARIA_3.jar `, { cwd:'./' }).then(function(result) {
       
        table+= `<tr><th>JAR PATAM</th><td>${result.stdout}</td></tr>` ;
      });

      await ssh.execCommand(`stat -c ‘%y’ /home/gamble/businessnet/11_COD_BALOTOCP_1.jar`, { cwd:'./' }).then(function(result) {
       
        table+= `<tr><th>JAR BALOTO</th><td>${result.stdout}</td></tr>` ;
      });

      await ssh.execCommand(`stat -c ‘%y’ /home/gamble/businessnet/ClientePosSlim-Giros.jar`, { cwd:'./' }).then(function(result) {
       
        table+= `<tr><th>JAR GIROS</th><td>${result.stdout}</td></tr>` ;
      });

      await ssh.execCommand(`stat -c ‘%y’ /home/gamble/businessnet/CodesaWrapperGiros.jar`, { cwd:'./' }).then(function(result) {
       
        table+= `<tr><th>JAR GIROS W</th><td>${result.stdout}</td></tr>` ;
      });

      

      $("#exampleModalLabel").html( ipPDV +" "+nombrePDV)
      table+="</table>";
      $("#modalBody").html(table);
      
      myModal.show();
      ssh.dispose();
    })
    .catch( (error)=>{
      console.log(error);
      ssh.dispose();
      $("#exampleModalLabel").html( "Error");
      $("#modalBody").html(error);;
      myModal.show();
    });
};

const closePosslim = (event) =>{

  if( confirm( "Realmente desea cerrar el posslim")){
  const ssh = new NodeSSH();

  let  obj                = event.target;
  let  ipPDV              = $.trim( $(obj).data("ip") );
  let  nombrePDV          = $.trim( $(obj).data("pdv") );
  
  myModal.hide();
  $("#exampleModalLabel").html( ipPDV +" "+nombrePDV)
  $("#modalBody").html("Iniciando Proceso de cerrado del posslim");
  myModal.show();

   ssh.connect ({
      host: ipPDV,
      username: data_ftp_ssh.user,
      password: data_ftp_ssh.password,
      port: data_ftp_ssh.port,
      readyTimeout: data_ftp_ssh.tiempoReconexion
    })
    .then( async function() {

      await  ssh.execCommand("kill -9 `ps -ef | grep ClientePosSlim | grep -v grep | awk '{print $2}'`", { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout);
        console.log('STDERR: ' + result.stderr);
        myModal.hide();
        $("#exampleModalLabel").html( ipPDV +" "+nombrePDV)
        $("#modalBody").html("Posslim Cerrado");
        myModal.show();   
        ssh.dispose();    
      });
    }).catch( (error)=>{
      console.log(error);
      myModal.hide();
      $("#exampleModalLabel").html( "Error");
      $("#modalBody").html(error);;
       myModal.show();
       ssh.dispose();
    });
  }
}

const openVNC = (event) => {

  let  obj                = event.target;
  let  ipPDV              = $.trim( $(obj).data("ip") );
  
  console.log('Abrir VNC '+ipPDV);

  
  let  executablePath = `${data_rutas_app.vnc}`;
  
  let spawn = require('child_process').spawn,
  ls  = spawn('cmd.exe', ['/c', executablePath, ipPDV,'-password',data_vnc.password]);
   
  ls.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });
  
  ls.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
      myModal.hide();
      $("#exampleModalLabel").html( "Error");
      $("#modalBody").html(data);
       myModal.show();
  });
   
  ls.on('exit', function (code) {
    //console.log('child process exited with code ' + code);
  });
}

const openPutty = ( event ) => {

  let  obj                = event.target;
  let  ipPDV              = $.trim( $(obj).data("ip") );
  
  console.log('Abrir Putty '+ipPDV);

  let  executablePath = `${data_rutas_app.putty}`;

 
  let spawn = require('child_process').spawn,
  ls  = spawn('cmd.exe', ['/c', executablePath,ipPDV,'-l',`${data_ftp_ssh.user}`,'-pw',`${data_ftp_ssh.password}`]);
   
  ls.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });
  
  ls.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
      myModal.hide();
      $("#exampleModalLabel").html( "Error");
      $("#modalBody").html(data);
       myModal.show();
  });
   
  ls.on('exit', function (code) {
    //console.log('child process exited with code ' + code);
  });
}

let dataJsonExcel = [];


const iperf3 = async (event, tipo = null)=>{

  const ssh = new NodeSSH();
  let  obj                = (!tipo ) ? event.target : event ;
  let  ipPDV              = $.trim( $(obj).data("ip") );
  let  nombrePDV          = $.trim( $(obj).data("pdv") );
  let  zona               = $.trim( $(obj).data("zona") );
  let  server             = $("#server option:selected").val().split('-');
  let  ipServer           = $.trim(server[0]);
  let  puerto             = $.trim(server[1]);
  let  zona_server        = $.trim(server[2]);

  /*const validTelnet = await validTelnetServer(ipServer,puerto);

  if( !validTelnet ){
    myModal.hide();
    $("#exampleModalLabel").html( "Error");
    $("#modalBody").html( "No se logro conectar con el servidor con la IP "+ipServer+" y puerto "+puerto);
     myModal.show();
    return;
  }*/

  $("#server").attr("disabled",true);


   $(obj).attr('disabled', true);
   $(obj).parent().find('.load').show().html("");
  
   myModal.hide();
   $("#exampleModalLabel").html("");
   $("#modalBody").html("");

   let contador = 1;

   const intervalID = setInterval (() => { 
    $(obj).parent().find('.load').html('<span style="font-size:40px;color:green;position:absolute;left:10px;">'+contador+'</span>');
    contador++;
    console.log(contador);
    if( contador > 60 ){
      $(obj).attr('disabled', false);
      $(obj).parent().find('.load').hide();
      clearInterval(intervalID);
      $("#server").attr("disabled",false);
      $("#exampleModalLabel").html( "Error");
      $("#modalBody").html(" Tiempo de espera agotado "+contador+" segundos");
      myModal.hide();
      (!tipo ) ? myModal.show() : '';
    }

   },1000);


   await ssh.connect ({
      host: ipPDV,
      username: data_ftp_ssh.user,
      password: data_ftp_ssh.password,
      port: data_ftp_ssh.port,
      readyTimeout: data_ftp_ssh.tiempoReconexion
    })
    .then( async function() {
      //console.log(`telnet ${ipServer} ${puerto} `);
      /*let validTelnet = false;

      await ssh.execCommand(`telnet ${ipServer} ${puerto} `, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

          $("#server").attr("disabled",false);
          $("#exampleModalLabel").html( "Error");
          $("#modalBody").html(result.stdout +" <br> "+ result.stderr);
           myModal.hide();
           myModal.show();

           if( result.stderr ){
            $(obj).attr('disabled', false);
            $(obj).parent().find('.load').hide();
            clearInterval(intervalID);
            return;
           }else{
            validTelnet = true;
           }
           

      });*/
     
    
      await  ssh.execCommand(`iperf3 -c ${ipServer} -p ${puerto}`, { cwd:'./' }).then(function(result) {
        console.log('STDOUT: ' + result.stdout);
        console.log('STDERR: ' + result.stderr);
        myModal.hide();

        let body; 

        if( !tipo ){
          dataJsonExcel = [];
        }
        if( result.stdout.length > 0 ){
            
            let arraySender   = result.stdout.split("- - - - - - - - - - - - - - - - - - - - - - - - -");
            let space         = arraySender[1].split(" ");
            console.log(space);
            console.log(space.filter( s => s !==""));
            space = space.filter( s => s !=="");


            let  transEnv = space[9]  + ' ' + space[10];
            let  bitraEnv = space[11] + ' ' + space[12];

            let  transRec = space[18]  + ' ' + space[19]
            let  bitraRec = space[20] + ' ' +  space[21];


            body = ( !tipo ) ? " <button class='btn btn-info' onclick='exportarExcel()'>Exportar</button>" : "";
            body += ` 
                     <table class='table table-bordered'>
                            <thead class="table-dark" >
                            <tr>
                             <th>Transfer</th><th>Bitrate</th> <th>Tipo</th>
                            </tr>
                            </thead>
                              <tr>
                                <!--<td>${space[7]} ${space[8]} </td>-->
                                <td>${transEnv} </td>
                                <td>${bitraEnv} </td>
                                <td>Enviado</td>
                              </tr>

                              <tr>
                                <!--<td>${space[16]} ${space[17]} </td>-->
                                <td> ${transRec}</td>
                                <td>${bitraRec} </td>
                                <td>Recibido</td>
                            </tr>
                          </table>`;
          let today = new Date();
          let now = today.toLocaleString();  // obtener la fecha y la hora
    
          /*let fila = [
              {
               FECHA    : now,
               IP       : ipPDV,
               PDV      : nombrePDV,
               //interval : space[7]  + ' ' + space[8],
               TRANSFER : transEnv,
               BITRATE  : bitraEnv,
               TIPO     : 'Enviado'
              },
              {
                FECHA    : now,
                IP       : ipPDV,
                PDV      : nombrePDV,
                //interval : space[16]  + ' ' + space[17],
                TRANSFER : transRec,
                BITRATE  : bitraRec,
                TIPO     : 'Recibido'
               },

          ];*/
          
          let hora  = now.split(" ");

          let fila = [{
            FECHA         : getFechaCompleta(),
            HORA          : hora[1],
            IP            : ipPDV,
            PDV           : nombrePDV,
            ZONA          : zona,
            TRANSFER_ENV  : transEnv,
            BITRATE_ENV   : bitraEnv,
            TRANSFER_REC  : transRec,
            BITRATE_REC   : bitraRec,
            IP_SERVER     : ipServer,
            PUERTO_SERVER : puerto,
            ZONA_SERVER   : zona_server
   
           }];
            
          dataJsonExcel.push( ...fila );
         
         insertRegistroMedidor(""+getFechaCompleta(),hora[1],ipPDV, transEnv, bitraEnv, transRec, bitraRec ,ipServer,puerto,zona_server); 
        }
        else{
          body = 'Error al obtener los datos  '+result.stderr;
        }
        
        $("#exampleModalLabel").html( ipPDV +" "+nombrePDV)
        $("#modalBody").html(body);
        (!tipo ) ? myModal.show() : '';    

        $(obj).attr('disabled', false);
        $(obj).parent().find('.load').hide();

        clearInterval(intervalID);

      }).catch ( (error) => {
          console.log(error);
          myModal.hide();
          $("#exampleModalLabel").html( "Error");
          $("#modalBody").html(error);
          (!tipo ) ? myModal.show() : '';
          $(obj).attr('disabled', false);
          $(obj).parent().find('.load').hide();
          clearInterval(intervalID);
      });
   


    }).catch( (error)=>{
      console.log(error);
      myModal.hide();
      $("#exampleModalLabel").html( "Error");
      $("#modalBody").html(error);
      (!tipo ) ? myModal.show() : '';
       $(obj).attr('disabled', false);
       $(obj).parent().find('.load').hide();
       clearInterval(intervalID);
    });
    $("#server").attr("disabled",false);
    
  
}


const exportarExcel = async( fecha = null) => {
      

      let fechaCompleta = (!fecha) ? getFechaCompleta("_"): fecha;

 
      let pathExcel  = __dirname+'/Reportes/iperf3_'+fechaCompleta+'.xlsx';
      let dirName    = 'iperf3_'+fechaCompleta+'.xlsx';
      const XLSX = require("xlsx")//npm install xlsx
      const newWB = XLSX.utils.book_new();
      const newWS = XLSX.utils.json_to_sheet(dataJsonExcel);
      XLSX.utils.book_append_sheet(newWB,newWS,"ReporteAnchoBanda")//workbook name as param
      await XLSX.writeFileXLSX(newWB,pathExcel)//file name as param*/
      var link = document.createElement('a');
      link.href = pathExcel;
      link.download = dirName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
} 


const iperAsync =  async ( btn ) => { 
  return new Promise((resolve, reject) => {
     resolve( iperf3( btn ,'todo') ) ;  
   
  }) 
};



const reporteExcel = async() => {

  let fechaInicial = $("#fechaInicial").val();
  let fechaFinal   = $("#FechaFinal").val();

  

  if( !fechaInicial || !fechaFinal )
  {
     myModal.hide();
     $("#exampleModalLabel").html( "Error");
     $("#modalBody").html( "Seleccione el rango de fecha");
     myModal.show();
  
    return;
  }

  fechaInicial = fechaInicial.split("-");
  fechaFinal   = fechaFinal.split("-");
  fechaInicial = fechaInicial[2]+"/"+fechaInicial[1]+"/"+fechaInicial[0];
  fechaFinal   = fechaFinal[2]+"/"+fechaFinal[1]+"/"+fechaFinal[0];

   console.log( fechaInicial, fechaFinal);


  let registrosMedidor = await getRegistrosMedidor( fechaInicial, fechaFinal );
  
  
  if( registrosMedidor.length > 0 ){

    dataJsonExcel = [];
    for ( let i=0; i<registrosMedidor.length;i++ ) {
  
      let dirIp       = $.trim( registrosMedidor[i]['IP']);
      let nombre      = $.trim( registrosMedidor[i]['NOMBRE'] ); 
      let zona        = $.trim( registrosMedidor[i]['ZONA'] ); 
      let fecha       = $.trim( registrosMedidor[i]['FECHA'] ); 
      let hora        = $.trim( registrosMedidor[i]['HORA'] );
      let tranferEnv  = $.trim( registrosMedidor[i]['TRANFER_ENV'] ).split(' ');
      let bitrateEnv  = $.trim( registrosMedidor[i]['BITRATE_ENV'] ).split(' ');
      let tranferRec  = $.trim( registrosMedidor[i]['TRANFER_REC'] ).split(' ');
      let bitrateRec  = $.trim( registrosMedidor[i]['BITRATE_REC'] ).split(' ');
      let ip_server   = $.trim( registrosMedidor[i]['IP_SERVER'] );
      let puerto      = $.trim( registrosMedidor[i]['PUERTO_SERVER'] );
      let zona_server = $.trim( registrosMedidor[i]['ZONA_SERVER'] ); 


      tranferEnv =  ( tranferEnv[1].includes('KBytes') ) ? ( Number( tranferEnv[0] ) / 1000)   :
                    ( tranferEnv[1].includes('GBytes') ) ? ( Number( tranferEnv[0] ) *1000 )   : Number( tranferEnv[0] );

      bitrateEnv =  ( bitrateEnv[1].includes('Kbits') )  ? ( Number( bitrateEnv[0] ) / 1000 )  :  
                    ( bitrateEnv[1].includes('GBits') )  ? ( Number( bitrateEnv[0] ) * 1000 )  : Number( bitrateEnv[0] );

      tranferRec =  ( tranferRec[1].includes('KBytes') ) ? ( Number( tranferRec[0] ) / 1000)   :  
                    ( tranferRec[1].includes('GBytes') ) ? ( Number( tranferRec[0] ) *1000 )   : Number(tranferRec[0]);///tranferRec[0].replace(',',',');

      bitrateRec =  ( bitrateRec[1].includes('Kbits') )  ? ( Number( bitrateRec[0] ) / 1000 )  :   
                    ( bitrateRec[1].includes('GBits') )  ? ( Number( bitrateRec[0] ) * 1000 )  : Number( bitrateRec[0]);//.replace(',',',');

        
      bitrateRec = bitrateRec.toLocaleString("en-US");
      tranferEnv = tranferEnv.toLocaleString("en-US");
      bitrateEnv = bitrateEnv.toLocaleString("en-US");
      tranferRec = tranferRec.toLocaleString("en-US");
     

      
      let fila = [{
         FECHA               : fecha,
         HORA                : hora,
         IP                  : dirIp,
         PDV                 : nombre,
         ZONA                : zona,
         TRANSFER_ENV_MBytes : tranferEnv,
         BITRATE_ENV_Mbits   : bitrateEnv,
         TRANSFER_REC_MBytes : tranferRec,
         BITRATE_REC_Mbits   : bitrateRec,
         IP_SERVER           : ip_server,
         PUERTO              : puerto,
         ZONA_SERVER         : zona_server

        }];
      
      dataJsonExcel.push( ...fila );
    }//Fin for
    console.log(dataJsonExcel);
    await exportarExcel();
  }//fin if
  else{
    myModal.hide();
    $("#exampleModalLabel").html( "Error");
    $("#modalBody").html( "No exiten registros en la fecha seleccionada");
    myModal.show();
  }


}







$("#iperf3Todo").click( async function(e){
 

  let  server             = $("#server option:selected").val().split('-');
  let  ipServer           = $.trim(server[0]);
  let  puerto             = $.trim(server[1]);
  let  zona_server        = $.trim(server[2]);

  /*const validTelnet = await validTelnetServer(ipServer,puerto);

  if( !validTelnet ){
    myModal.hide();
    $("#exampleModalLabel").html( "Error");
    $("#modalBody").html( "No se logro conectar con el servidor con la IP "+puerto+" y puerto "+puerto);
     myModal.show();
    return;
  }*/

  if( !confirm("Realmente desea generar el todo ?") ){
    $(this).attr('disabled', false);
    return;
  }

  let contadorReg = 0;
  let total       = $("#listadoPDV > tr").length;

  $("#server").attr("disabled",true);

  $(this).attr('disabled', true);
  
  $("#totalIperf3").html( contadorReg + " de "+ total).show();

  for ( let i=0; i < total; i++) {

      let btn   =   $("#listadoPDV > tr:eq("+i+")").find('td').children('.btnIperf3');
      let dirIp =   $("#listadoPDV > tr:eq("+i+")").find('td.dirIP').text() ;
      console.log( dirIp );

      if( !btn.attr("disabled")){
        await iperAsync(btn[0]);
        contadorReg++;
        $("#totalIperf3").html( contadorReg + " de "+ total);
      }

      //if( contadorReg == 2) break;
  }

  exportarExcel();
  $(this).attr('disabled', false);
  $("#server").attr("disabled",false);
  
});

const getFechaCompleta = (sep = "/") => {
  let today = new Date();
  let day = today.getDate();
  let month = today.getMonth() + 1;
  let year = today.getFullYear();
  
  day   = ( day < 10 ) ? '0'+day : day; 
  month = ( month < 10 ) ? '0'+month : month; 
  return `${day}${sep}${month}${sep}${year}`
}




/*const validTelnetServer = async( ip='172.16.20.45', puerto='5002' ) => {
 

  const net = require("net");

  let validTelnet = false;

  try {
    let client = await net.connect({
      host: '172.16.20.49', 
      port: puerto,
      }, async()=> {
      console.log("Telnet OK");
      validTelnet = true;
      /*client.write("TELNET COMMAND HERE", ()=>{
          console.log("Telnet OK");
          validTelnet = true;

      })*/
    /*});
    console.log('validTelnet'+validTelnet);
    return validTelnet;

  } catch (error) {
    validTelnet = false;
    console.log(error + 'Error al ejecutar telnet');
  }


}*/










