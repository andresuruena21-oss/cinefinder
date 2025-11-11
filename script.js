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
        alert("Escribe algo en el campo de busqueda");
        return;
    }

    //actualizamos las variables de estado principales

    modoActual=selectorModo.value;
    textoBusquedaActual=textoUsuario;
    añoBusquedaActual=añoUsuario;
    paginaActual=1; // siempre se inicia en la pagina 1

    //ejecutamos la busqueda
    ejecutarBusqueda();
})
//BOTON DE LA LA PAGINA SIGUIENTE

botonPaginaSiguiente.addEventListener("click",()=>{
    //la paginacion solo tiene sentido si se usa el modo de busqueda

    if(modoActual!=='s'){
        alert("no hay mas paginas disponibles");
        return;
    }

    //si no se a hecho una busqueda no tiene sentido pasar a la pagina siguiente
    if(!textoBusquedaActual){
        alert("Primero realiza una busqueda");
        return;
    }
    //calculamos cuantas pagina maximas hay (cada pagina tiene 10 resultados)
    const paginasMaximas=Math.ceil(totalResultados/10);

    if(paginaActual >= paginasMaximas){
        alert("no hay mas paginas disponibles por el momento");
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
            } else {
                divInfo.textContent =`Error: ${datos.Error || "Sin resultados"}`
            }
            totalResultados = 0;
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
        }

        //CASO 2 MODO TITULO EXACTO (t) O ID DE IMDB (i)
        if (modoActual === "t" || modoActual === "i"){
            //datos es un objeto con muchos campos de la pelicula
            mostrarDetallePelicula(datos);
            divInfo.textContent =
        `Modo: ${modoActual.toUpperCase()} | Titulo: ${datos.Title}`;
        }

    } catch (error){
        console.error(error);
        divInfo.textContent="Ocurrio un error al consultar en la base de datos ";
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