//configuracion de la api

const CLAVE_API="acb60b3b";

const URL_API="https://www.omdbapi.com/";

//referncias a los elementos del html


//select donde se elige el tipo de busqueda

const selectorModo= document.getElementById("mode");
//input donde el usuario escribe el texto de la busqueda
const campoTextoBusqueda=document.getElementById("queryInput");
//input numerico para el año de la busquedq
const campoAño=document.getElementById("yearInput");
//boton de buscar
const botonBuscar=document.getElementById("searchButton");
//boton de pagina siguiente
const botonPaginaSiguiente=document.getElementById("nextPageButton");
//div donde se van a mostrar los mensajes de error
const divInfo=document.getElementById("info");

//div donde se estan las tarjetas de la peliculas

const contenedorResultados=document.getElementById("results");

//referencias para las nuevas funcionalidades
//contenedor de alertas para mensajes de advertencia
const contenedorAlertas=document.getElementById("alertContainer");
//div para mostrar la informacion de busqueda mejorada
const divInfoBusqueda=document.getElementById("searchInfo");
//boton para cambiar el tema (diurno/nocturno)
const botonTema=document.getElementById("themeToggle");
//icono del tema dentro del boton
const iconoTema=botonTema.querySelector(".theme-icon");
//contenedor de búsquedas recientes
const contenedorBusquedasRecientes=document.getElementById("recentSearchesList");

const banner = document.getElementById("banner");
//poster que se van a usar como fondo 
let listaPostersFondo=[];

let indicePosterFondo=0;

let intervaloFondos= null;

//variables de estado para recordar a ultima busqueda
//modo actual : s = texto en el titulo, t=titulo exacto, i= id de imdb
let modoActual="s";
let textoBusquedaActual="";
let añoBusquedaActual="";
let paginaActual=1; // pagina actual de resultados cuando modoActual===s
let totalResultados=0; // cuando modoActual=== s

//constantes para localStorage
const CLAVE_BUSQUEDAS_RECIENTES="cineFinder_busquedas_recientes";
const CLAVE_TEMA="cineFinder_tema";
const MAX_BUSQUEDAS_RECIENTES=10; //numero maximo de busquedas recientes a guardar

// ===========================
// FUNCIONES PARA LOCALSTORAGE (BÚSQUEDAS RECIENTES)
// ===========================

//funcion para obtener las búsquedas recientes del localStorage
function obtenerBusquedasRecientes(){
    try{
        const busquedas=localStorage.getItem(CLAVE_BUSQUEDAS_RECIENTES);
        return busquedas ? JSON.parse(busquedas) : [];
    }catch(error){
        console.error("Error al leer búsquedas recientes:",error);
        return [];
    }
}

//funcion para guardar una nueva búsqueda en el localStorage
function guardarBusquedaReciente(texto,modo,año){
    try{
        let busquedas=obtenerBusquedasRecientes();
        
        //creamos un objeto con la información de la búsqueda
        const nuevaBusqueda={
            texto:texto,
            modo:modo,
            año:año || "",
            fecha:new Date().toISOString()
        };
        
        //eliminamos búsquedas duplicadas (mismo texto, modo y año)
        busquedas=busquedas.filter(b=>
            !(b.texto===texto && b.modo===modo && b.año===(año || ""))
        );
        
        //agregamos la nueva búsqueda al inicio
        busquedas.unshift(nuevaBusqueda);
        
        //limitamos el número de búsquedas guardadas
        if(busquedas.length>MAX_BUSQUEDAS_RECIENTES){
            busquedas=busquedas.slice(0,MAX_BUSQUEDAS_RECIENTES);
        }
        
        //guardamos en localStorage
        localStorage.setItem(CLAVE_BUSQUEDAS_RECIENTES,JSON.stringify(busquedas));
        
        //actualizamos la lista visual
        mostrarBusquedasRecientes();
    }catch(error){
        console.error("Error al guardar búsqueda reciente:",error);
    }
}

//funcion para eliminar una búsqueda reciente del localStorage
function eliminarBusquedaReciente(indice){
    try{
        let busquedas=obtenerBusquedasRecientes();
        busquedas.splice(indice,1);
        localStorage.setItem(CLAVE_BUSQUEDAS_RECIENTES,JSON.stringify(busquedas));
        mostrarBusquedasRecientes();
    }catch(error){
        console.error("Error al eliminar búsqueda reciente:",error);
    }
}

//funcion para mostrar las búsquedas recientes en el sidebar
function mostrarBusquedasRecientes(){
    const busquedas=obtenerBusquedasRecientes();
    
    //limpiamos el contenedor
    contenedorBusquedasRecientes.innerHTML="";
    
    if(busquedas.length===0){
        //si no hay búsquedas, mostramos un mensaje
        const mensaje=document.createElement("p");
        mensaje.className="no-recent-searches";
        mensaje.textContent="No hay búsquedas recientes";
        contenedorBusquedasRecientes.appendChild(mensaje);
        return;
    }
    
    //creamos un elemento para cada búsqueda reciente
    busquedas.forEach((busqueda,indice)=>{
        const item=document.createElement("div");
        item.className="recent-search-item";
        
        //texto de la búsqueda (incluye modo y año si existe)
        let textoMostrar=busqueda.texto;
        if(busqueda.modo==="s"){
            textoMostrar+=" (Texto)";
        }else if(busqueda.modo==="t"){
            textoMostrar+=" (Exacto)";
        }else if(busqueda.modo==="i"){
            textoMostrar+=" (ID)";
        }
        if(busqueda.año){
            textoMostrar+=` - ${busqueda.año}`;
        }
        
        item.innerHTML=`
            <span class="recent-search-text">${textoMostrar}</span>
            <button class="recent-search-remove" title="Eliminar">×</button>
        `;
        
        //evento click para restaurar la búsqueda
        item.addEventListener("click",(e)=>{
            //si se hace click en el botón de eliminar, no restaurar
            if(e.target.classList.contains("recent-search-remove")){
                return;
            }
            //restauramos los valores de la búsqueda
            selectorModo.value=busqueda.modo;
            campoTextoBusqueda.value=busqueda.texto;
            campoAño.value=busqueda.año || "";
            //actualizamos el modo y ejecutamos la búsqueda
            modoActual=busqueda.modo;
            textoBusquedaActual=busqueda.texto;
            añoBusquedaActual=busqueda.año || "";
            paginaActual=1;
            ejecutarBusqueda();
        });
        
        //evento click para eliminar la búsqueda
        const botonEliminar=item.querySelector(".recent-search-remove");
        botonEliminar.addEventListener("click",(e)=>{
            e.stopPropagation(); //evitamos que se active el click del item
            eliminarBusquedaReciente(indice);
        });
        
        contenedorBusquedasRecientes.appendChild(item);
    });
}

// ===========================
// FUNCIONES PARA MODO DIURNO/NOCTURNO
// ===========================

//funcion para obtener el tema guardado en localStorage
function obtenerTemaGuardado(){
    try{
        return localStorage.getItem(CLAVE_TEMA) || "dark";
    }catch(error){
        console.error("Error al leer tema:",error);
        return "dark";
    }
}

//funcion para guardar el tema en localStorage
function guardarTema(tema){
    try{
        localStorage.setItem(CLAVE_TEMA,tema);
    }catch(error){
        console.error("Error al guardar tema:",error);
    }
}

//funcion para aplicar el tema (diurno o nocturno)
function aplicarTema(tema){
    if(tema==="light"){
        document.body.classList.add("light-mode");
        iconoTema.textContent="☀️";
    }else{
        document.body.classList.remove("light-mode");
        iconoTema.textContent="🌙";
    }
    guardarTema(tema);
}

//evento click en el botón de tema
botonTema.addEventListener("click",()=>{
    const temaActual=document.body.classList.contains("light-mode") ? "light" : "dark";
    const nuevoTema=temaActual==="light" ? "dark" : "light";
    aplicarTema(nuevoTema);
});

//aplicamos el tema guardado al cargar la página
aplicarTema(obtenerTemaGuardado());

// ===========================
// FUNCIONES PARA MENSAJES DE ADVERTENCIA (REEMPLAZAR ALERT)
// ===========================

//funcion para mostrar un mensaje de advertencia en lugar de usar alert()
function mostrarAlerta(mensaje,tipo="error"){
    //creamos el elemento de alerta
    const alerta=document.createElement("div");
    alerta.className=`alert ${tipo}`;
    
    //icono según el tipo
    let icono="❌";
    if(tipo==="warning"){
        icono="⚠️";
    }else if(tipo==="info"){
        icono="ℹ️";
    }
    
    alerta.innerHTML=`
        <span>${icono}</span>
        <span>${mensaje}</span>
        <button class="alert-close">×</button>
    `;
    
    //botón para cerrar la alerta
    const botonCerrar=alerta.querySelector(".alert-close");
    botonCerrar.addEventListener("click",()=>{
        alerta.remove();
    });
    
    //agregamos la alerta al contenedor
    contenedorAlertas.appendChild(alerta);
    
    //eliminamos automáticamente después de 5 segundos
    setTimeout(()=>{
        if(alerta.parentNode){
            alerta.remove();
        }
    },5000);
}

// ===========================
// FUNCIONES PARA INFORMACIÓN DE BÚSQUEDA MEJORADA
// ===========================

//funcion para mostrar la información de búsqueda con mejor diseño
function mostrarInfoBusqueda(modo,resultados,pagina,paginasMaximas,titulo){
    //limpiamos el contenido anterior
    divInfoBusqueda.innerHTML="";
    
    if(modo==="s"){
        //modo de búsqueda por texto
        divInfoBusqueda.innerHTML=`
            <div class="search-info-item">
                <span class="search-info-label">Modo:</span>
                <span class="search-info-value">Texto en el título</span>
            </div>
            <span class="search-info-separator">|</span>
            <div class="search-info-item">
                <span class="search-info-label">Resultados:</span>
                <span class="search-info-value">${resultados}</span>
            </div>
            <span class="search-info-separator">|</span>
            <div class="search-info-item">
                <span class="search-info-label">Página:</span>
                <span class="search-info-value">${pagina} de ${paginasMaximas}</span>
            </div>
        `;
    }else if(modo==="t" || modo==="i"){
        //modo de título exacto o ID
        const modoTexto=modo==="t" ? "Título exacto" : "ID de IMDb";
        divInfoBusqueda.innerHTML=`
            <div class="search-info-item">
                <span class="search-info-label">Modo:</span>
                <span class="search-info-value">${modoTexto}</span>
            </div>
            <span class="search-info-separator">|</span>
            <div class="search-info-item">
                <span class="search-info-label">Título:</span>
                <span class="search-info-value">${titulo || "N/A"}</span>
            </div>
        `;
    }
}

// ===========================
// EVENTOS Y FUNCIONALIDADES PRINCIPALES
// ===========================

// cambio de modo de busqueda s , t , t y el placeholder 

selectorModo.addEventListener("change",()=>{
    modoActual=selectorModo.value; // se actualiza segun el valor del select

if(modoActual==='s'){
    campoTextoBusqueda.placeholder="Texto del titulo : ejemplo: Batman";
    campoAño.disabled=false; // el año se puede usar como un filtro
}else if(modoActual==='t'){
    campoTextoBusqueda.placeholder="Titulo exacto : ejemplo: Batman Begins";
    campoAño.disabled=false; // el año se puede usar como un filtro
}else if(modoActual==='i'){
    //id de imdb
    campoTextoBusqueda.placeholder="ID de IMDB : ejemplo: tt0372784";
    campoAño.disabled=true; // el año no se puede usar como un filtro
    campoAño.value=""; //se limpia el año
}
});

//place holder cuando inicia la pagina por primera vez
campoTextoBusqueda.placeholder="Texto del titulo : ejemplo: Batman";

//EVENTO DE CLICK EN EL BOTON DE BUSCAR 

botonBuscar.addEventListener("click",()=>{
    //tomamos los valores que la persona escribio

    const textoUsuario=campoTextoBusqueda.value.trim();
    const añoUsuario=campoAño.value.trim();

    //validacion basica
    if(!textoUsuario){
        mostrarAlerta("Escribe algo en el campo de búsqueda","warning");
        return;
    }

    //actualizamos las variables de estado principales

    modoActual=selectorModo.value;
    textoBusquedaActual=textoUsuario;
    añoBusquedaActual=añoUsuario;
    paginaActual=1; // siempre se inicia en la pagina 1

    //guardamos la búsqueda en el historial
    guardarBusquedaReciente(textoUsuario,modoActual,añoUsuario);

    //ejecutamos la busqueda
    ejecutarBusqueda();
})

//BOTON DE LA LA PAGINA SIGUIENTE

botonPaginaSiguiente.addEventListener("click",()=>{
    //la paginacion solo tiene sentido si se usa el modo de busqueda

    if(modoActual!=='s'){
        mostrarAlerta("No hay más páginas disponibles","warning");
        return;
    }

    //si no se a hecho una busqueda no tiene sentido pasar a la pagina siguiente
    if(!textoBusquedaActual){
        mostrarAlerta("Primero realiza una búsqueda","warning");
        return;
    }
    //calculamos cuantas pagina maximas hay (cada pagina tiene 10 resultados)
    const paginasMaximas=Math.ceil(totalResultados/10);

    if(paginaActual >= paginasMaximas){
        mostrarAlerta("No hay más páginas disponibles por el momento","warning");
        return;
    }


    //avanzamos a la pagina siguiente y volvemos a ejecutar la busqueda

    paginaActual++;
    ejecutarBusqueda();
});


//FUNCION PRINCIPAL PARA CONSTRUIR LA URL Y HACER LA PETICION A LA API
async function ejecutarBusqueda(){

    try{
        //se borran resultados anteriores y se muestra un mensaje de carga 
        contenedorResultados.innerHTML="";
        divInfo.textContent="Cargando resultados...";
        divInfoBusqueda.innerHTML=""; //limpiamos la información de búsqueda

        //empezamos a construir la url de la peticion del usuario
        let url = `${URL_API}?apikey=${CLAVE_API}`;

        //dependiendo del modo se agregan los parametros correspondientes

        if (modoActual === "s"){
            //modo de texto : texto que aparece en el titulo de la pelicula
            url +=`&s=${encodeURIComponent(textoBusquedaActual)}`;

            //si el usuario escribio un año se agrega como filtro
            if(añoBusquedaActual){
                url +=`&y=${encodeURIComponent(añoBusquedaActual)}`;
            }

            //se agrega el numero de pagina
            url +=`&page=${paginaActual}`;

        } else if (modoActual === "t"){
            //modo de titulo exacto : la API busca un solo resultado
            url +=`&t=${encodeURIComponent(textoBusquedaActual)}`;

            //el año tambien se puede usar como filtro con t=
            if(añoBusquedaActual){
                url +=`&y=${encodeURIComponent(añoBusquedaActual)}`;
            }

        } else if (modoActual === "i"){
            //modo de id de imdb
            //se usa solo el parametro i
            url +=`&i=${encodeURIComponent(textoBusquedaActual)}`;
        }

        //para verificar que la url este bien construida
        console.log("URL que se consulta 👉", url);

        //hacemos la peticion de la api con fetch(esto devuelve una promesa)
        const respuesta = await fetch(url);

        //convertimos la respuesta en formato json 
        const datos = await respuesta.json();

        console.log("Respuesta de la API 👉", datos);

        //la api de omdb responde "True" o "False" para indicar exito o error
        if(datos.Response === "False"){
            //mostramos el error que envia la API 
            if (datos.Error === "Incorrect IMDb ID.") {
                divInfo.textContent = "❌ No se encontro ninguna pelicula con ese titulo o ID.";
                mostrarAlerta("No se encontró ninguna película con ese título o ID","error");
            } else {
                divInfo.textContent =`Error: ${datos.Error || "Sin resultados"}`;
                mostrarAlerta(datos.Error || "Sin resultados","error");
            }
            totalResultados = 0;
            divInfoBusqueda.innerHTML=""; //limpiamos la información
            return;
        }

        //CASO 1 MODO TEXTO (s)
        if(modoActual === "s"){
            totalResultados = parseInt(datos.totalResults || "0", 10);

            const peliculas = datos.Search || [];
            mostrarListaPeliculas(peliculas);

            const paginasMaximas = Math.ceil(totalResultados/10) || 1;
            //Actualizamos el mensaje de informacion
            divInfo.textContent =
        `Modo : texto en el titulo | resultados: ${totalResultados} | pagina ${paginaActual} de ${paginasMaximas}`;
            
            //mostramos la información mejorada
            mostrarInfoBusqueda("s",totalResultados,paginaActual,paginasMaximas);
        }

        //CASO 2 MODO TITULO EXACTO (t) O ID DE IMDB (i)
        if (modoActual === "t" || modoActual === "i"){
            //datos es un objeto con muchos campos de la pelicula
            mostrarDetallePelicula(datos);
            divInfo.textContent =
        `Modo: ${modoActual.toUpperCase()} | Titulo: ${datos.Title}`;
            
            //mostramos la información mejorada
            const modoTexto=modoActual==="t" ? "Título exacto" : "ID de IMDb";
            mostrarInfoBusqueda(modoActual,0,0,0,datos.Title);
        }

    } catch (error){
        console.error(error);
        divInfo.textContent="Ocurrio un error al consultar en la base de datos ";
        mostrarAlerta("Ocurrió un error al consultar la base de datos","error");
        divInfoBusqueda.innerHTML=""; //limpiamos la información
    }

}

// FUNCIONES PARA EL FONDO DINÁMICO DEL BANNER

//esta funcion recibe una lista de peliculas y extrae los posters validos
function actualizarFondosConPeliculas(listaPeliculas) {
    //sacamos solo los posters validos
    const postersValidos = listaPeliculas
        .map(p => p.Poster)                 // tomamos solo el campo Poster
        .filter(p => p && p !== "N/A");     // quitamos los que vienen vacios o "N/A"

    //si no hay posters validos, no hacemos nada
    if (postersValidos.length === 0) {
        return;
    }

    //guardamos la nueva lista de posters de fondo
    listaPostersFondo = postersValidos;
    indicePosterFondo = 0;

    //si ya habia un intervalo corriendo, lo detenemos para empezar otro
    if (intervaloFondos) {
        clearInterval(intervaloFondos);
        intervaloFondos = null;
    }

    //colocamos de una vez el primer poster como fondo del banner
    document.body.style.backgroundImage =`url("${listaPostersFondo[indicePosterFondo]}")`;
    

    //iniciamos el carrusel que va cambiando de poster cada 6 segundos (por ejemplo)
    intervaloFondos = setInterval(() => {
        if (listaPostersFondo.length === 0) return;

        //avanzamos al siguiente poster (en circulo)
        indicePosterFondo = (indicePosterFondo + 1) % listaPostersFondo.length;

        //cambiamos el fondo del banner
        const siguientePoster = listaPostersFondo[indicePosterFondo];
        document.body.style.backgroundImage =`url("${siguientePoster}")`;
        
    }, 6000); // 6000 ms = 6 segundos
}




//FUNCION PARA MOSTRAR LAS PELICULAS EN MODO DE TEXTO 

function mostrarListaPeliculas(listaPeliculas){

    //limpiamos el contenedor de resultados 
    contenedorResultados.innerHTML="";
    
    //se recorre el arreglo de peliculas que dio la API
    listaPeliculas.forEach((pelicula)=>{

        //SE CREA LA TARJETA PARA CADA PELÍCULA
        const tarjeta = document.createElement("div");
        tarjeta.className="movie-card";

        //si el poster viene con "N/A se pone una imagen por defecto"
        const poster =
            pelicula.Poster && pelicula.Poster !=="N/A"
            ? pelicula.Poster
            : "https://via.placeholder.com/150x220?text=No+Image";

        //armamos el texto de busqueda para el trailer en youtube
        //ejemplo: "Batman official trailer"
        const textoTrailer =`${pelicula.Title} official trailer`;

        //codificamos el texto para ponerlo en la url
        const tituloCodificado = encodeURIComponent(textoTrailer);

        //url de búsqueda en youtube
        const urlTrailer =`https://www.youtube.com/results?search_query=${tituloCodificado}`;

        // Definimos el contenido HTML de la tarjeta
        tarjeta.innerHTML = `
        <img src="${poster}" alt="${pelicula.Title}">
        <div class="movie-info">
            <div class="movie-title">${pelicula.Title}</div>
            <div class="movie-meta">Año: ${pelicula.Year}</div>
            <div class="movie-meta">Tipo: ${pelicula.Type}</div>
            <div class="movie-meta">ID IMDb: ${pelicula.imdbID}</div>

            <!-- BOTÓN PARA VER EL TRAILER EN YOUTUBE -->
            <a href="${urlTrailer}" target="_blank" class="boton-trailer">
            Ver trailer en YouTube
            </a>
        </div>
        `;

        // Agregamos la tarjeta al contenedor de resultados
        contenedorResultados.appendChild(tarjeta);
    });

    actualizarFondosConPeliculas(listaPeliculas);

}

//FUNCION : MOSTRAR EL DETALLE DE UNA PELICULA 
function mostrarDetallePelicula(pelicula){
    contenedorResultados.innerHTML="";

    //se crea la tarjeta para el detalle de la pelicula
    const tarjeta = document.createElement("div");
    tarjeta.className="movie-card";

    //elegimos poster o imagen de relleno
    const poster=
    pelicula.Poster && pelicula.Poster !=="N/A"
    ? pelicula.Poster
    : "https://via.placeholder.com/150x220?text=No+Image";

    //armamos el texto de busqueda para el trailer en youtube
    const textoTrailer =`${pelicula.Title} official trailer`;
    const tituloCodificado = encodeURIComponent(textoTrailer);
    const urlTrailer = `https://www.youtube.com/results?search_query=${tituloCodificado}`;

    // Contenido detallado de la película
    tarjeta.innerHTML = `
    <img src="${poster}" alt="${pelicula.Title}">
    <div class="movie-info">
        <div class="movie-title">${pelicula.Title}</div>
        <div class="movie-meta">Año: ${pelicula.Year}</div>
        <div class="movie-meta">Género: ${pelicula.Genre}</div>
        <div class="movie-meta">Director: ${pelicula.Director}</div>
        <div class="movie-meta">Actores: ${pelicula.Actors}</div>
        <div class="movie-meta">IMDb: ⭐ ${pelicula.imdbRating}</div>
        <div class="movie-plot">${pelicula.Plot}</div>
        <div class="movie-meta">ID IMDb: ${pelicula.imdbID}</div>
        <div class="movie-meta">Tipo: ${pelicula.Type}</div>

        <!-- BOTÓN PARA VER EL TRAILER EN YOUTUBE -->
        <a href="${urlTrailer}" target="_blank" class="boton-trailer">
            Ver trailer en YouTube
        </a>
    </div>
    `;

  // Agregamos la tarjeta al contenedor
contenedorResultados.appendChild(tarjeta);

actualizarFondosConPeliculas([pelicula]);


}

//cargamos las búsquedas recientes al iniciar la página
mostrarBusquedasRecientes();
