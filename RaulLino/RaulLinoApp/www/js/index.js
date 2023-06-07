/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready

var gpsPosition;//coordenadas do utilizador
var abrantesLat = 39.46332002046439;//latitude da Abrantes
var abrantesLong = -8.199677027352164;//longintude de Abrantes
var map;//referencia para o mapa
var greenIcon, yellowIcon;//icons para o mapa

var curPag = "none";//nome da página atual

var userMarker;//referencia para o marcardor da localização do utilizador
var gpsMarker = false; //boolean que mostra se existe um marker da localização do utilizador

var idPag = -1;//index da página de um edificio a ser apresentada
var lang =0 ;//flag para a linguagem a ser apresentada
var itinerario = [];


/**
 * função chamada quando o cordova esta pronto para correr do dispositivo do utilizador
 */
function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    document.addEventListener("backbutton", onBackKeyDown, false);

    yellowIcon = L.icon({
        iconUrl: 'www/img/centro.svg',

        iconSize: [65, 150], // size of the icon
        iconAnchor: [40, 120], // point of the icon which will correspond to marker's location
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });

    greenIcon = L.icon({
        iconUrl: 'img/pontointeresse.png',

        iconSize: [40, 80], // size of the icon
        iconAnchor: [20, 60], // point of the icon which will correspond to marker's location
        popupAnchor: [-3, -50] // point from which the popup should open relative to the iconAnchor
    });
}

/**
 * função chamada quando a página fotos fica totalmente carregada
 */
function onLoadFotos() {
    var w = window.innerWidth;
    ins_cart(parseInt(w / 350) > 3 ? 3 : parseInt(w / 350));
    curPag = "Fotos";
}

/**
 * função chamada quando a página Mapa fica totalmente carregada
 */
function onLoadMap() {
    navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError);
    curPag = "Map";
    getItinerarios();
    mostraMap();
}

/**
 * função chamada quando a página Home fica totalmente carregada
 */
function onLoadHome() {
    curPag = "Home";
    ver_window();
}

/**
 * função chamada quando a página de um edifício fica totalmente carregada
 */
function onLoadPagina() {
    curPag = "Pagina";
    idPag = getCookie("idPag");
    fetch("dados.json")
        .then(response => response.json())
        .then(json => {

            var carr =
                '<div id="carouselExampleControls" class="carousel slide" data-bs-ride="carousel">' +
                '<div class="carousel-inner">';
            json.dados[idPag].imagens.forEach(element => {
                carr += '<center><div class="carousel-item active" ><img  style="max-width:1000px; max-height:800px;" src="' + element + '" class="d-block w-100" ></div></center>'
            });
            carr += '</div>' +
                '<button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleControls"' +
                'data-bs-slide="prev">' +
                '<span class="carousel-control-prev-icon" aria-hidden="true"></span>' +
                '<span class="visually-hidden">Previous</span>' +
                '</button>' +
                '<button class="carousel-control-next" type="button" data-bs-target="#carouselExampleControls"' +
                'data-bs-slide="next">' +
                '<span class="carousel-control-next-icon" aria-hidden="true"></span>' +
                '<span class="visually-hidden">Next</span>' +
                '</button>' +
                '</div>';

            document.getElementById("carImag").innerHTML = carr;

            document.getElementById("pagina_titulo").textContent = json.dados[idPag].titulo;
            document.getElementById("pagina_ano").textContent = json.dados[idPag].ano;
            document.getElementById("pagina_localizacao").textContent = json.dados[idPag].localizacao;
            document.getElementById("pagina_tipologia").textContent = json.dados[idPag].tipologia;
            document.getElementById("pagina_informacao").textContent = json.dados[idPag].info;
        });
}

/**
 * função chamada quando uma página generica fica totalmente carregada
 */
function onLoad() {
    curPag = "none";
}

/**
 * função chamada quando se clica no botão de voltar
 */
function onBackKeyDown() {
    //fazer código para o botão de voltar a trás
}

/**
 * função chamado quando o mapa é carregado e quando o dispostivo encontrar com sucesso a localização do utilizador
 * @param {*} position 
 */
function onGPSSuccess(position) {
    gpsPosition = position.coords;

    map = L.map('map', {
        zoomControl: false
    }).setView([abrantesLat, abrantesLong], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    addMarkers();

    //obter a localização do utilizador e adicionar o marcador no mapa
    getLocation();
};

/**
 * adiciona os marcadores dos edificios ao mapa
 */
function addMarkers() {
    fetch("dados.json")
        .then(response => response.json())
        .then(json => {
            var i = 0;
            json.dados.forEach(element => {
                L.marker([element.coordenadas[0], element.coordenadas[1]], { icon: greenIcon }).addTo(map)
                    .bindPopup('<div onMouseOver="idPagVer(' + i + ');" style="display: flex; align-items: center;"><a href="pagina.html" style="cursor:pointer;"><span>' + element.titulo + '</span></a><img onclick="addItinerario(' + i + ')" src="../img/mais_preto.svg" width="50px" style="margin-left:auto;"/></div>')
                i++;
            });
        });
}

/**
 * Adiciona um edificio ao itinerário e guarda o array em localStorage
 * @param {*} i 
 */
function addItinerario(i) {
    var add = true;
    for (let j = 0; j < itinerario.length; j++) {
        if (itinerario[j] == i) {
            add = false;
        }
    }
    if (add) {
        itinerario.push(i);
        localStorage.setItem("itinerario", itinerario.join('|'));
    }
}

/**
 * Atualiza o array itinerarios com os dados guardados em localStorage
 */
function getItinerarios() {
    var storage = localStorage.getItem("itinerario");
    if(storage == null) return;
    var aux = aux.split('|');
    for (let i = 0; i < aux.length; i++) {
        itinerario[i] = parseInt(aux[i]);
    }

}


/**
 * função chamado quando o mapa é carregado e quando o dispostivo não encontrar a localização do utilizador
 * @param {*} error 
 */
function onGPSError(error) {
    alert('code: ' + error.code + '\n' +
        'message: ' + error.message + '\n');
}

/**
 * Obtém a localização do utilizador e coloca um marcador nessa posição
 */
function getLocation() {
    if (curPag == "Map") {
        navigator.geolocation.getCurrentPosition(GPSUserCoords, onGPSError);
        if (gpsMarker) {
            userMarker.setLatLng([gpsPosition.latitude, gpsPosition.longitude]);
        } else {
            userMarker = new L.marker([gpsPosition.latitude, gpsPosition.longitude]);
            gpsMarker = true;
            userMarker.addTo(map);
        }
    }
}

/**
 * atualiza as coordenadas do utilizador
 * @param {*} e 
 */
function GPSUserCoords(e) {
    gpsPosition = e.coords;
}

/**
 * calcula a distancia entre dois pontos do mapa
 * @param {*} lat1 
 * @param {*} lon1 
 * @param {*} lat2 
 * @param {*} lon2 
 * @returns 
 */
function GPSDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const teta1 = lat1 * Math.PI / 180; // φ, λ in radians
    const teta2 = lat2 * Math.PI / 180;
    const deltat = (lat2 - lat1) * Math.PI / 180;
    const deltae = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltat / 2) * Math.sin(deltat / 2) +
        Math.cos(teta1) * Math.cos(teta2) *
        Math.sin(deltae / 2) * Math.sin(deltae / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // in metres

    return d;
}

/**
 * função para fazer zoom in no mapa
 */
function ZoomIN() {
    var zoomInButton = document.getElementById('zoom-in-button');
    zoomInButton.addEventListener('click', function () {
        map.setZoom(map.getZoom() + 1);
    });
}

/**
 * função para fazer zoom out no mapa
 */
function ZoomOUT() {
    var zoomOutButton = document.getElementById('zoom-out-button');
    zoomOutButton.addEventListener('click', function () {
        map.setZoom(map.getZoom() - 1);
    });
}

/**
 * função para centrar o mapa na localização do utilizador
 */
function localizacaoAtual() {
    map.setView({ lat: gpsPosition.latitude, lng: gpsPosition.longitude }, 14);
}

/**
 * Função para centrar o mapa em Abrantes
 */
function localizacaoAbrant() {
    map.setView({ lat: abrantesLat, lng: abrantesLong }, 14);
}

/**
 * função que permite obter o valor de um cookie específico
 * @param {*} name 
 * @returns 
 */
function getCookie(name) {
    var cookies = document.cookie.split("; ");
    for (var i = 0; i < cookies.length; i++) {
        var parts = cookies[i].split("=");
        if (parts[0] === name) {
            return decodeURIComponent(parts[1]);
        }
    }
    return null;
}

/**
 * guardar a pagina de edifício a ser apresentada
 * @param {*} i 
 */
function idPagVer(i) {
    idPag = i;
    document.cookie = "idPag=" + i;
}

/**
 * coloca o código HTML dos cartões da página Fotos
 * @param {*} num_column 
 */
function ins_cart(num_column) {
    fetch(fileData())
        .then(response => response.json())
        .then(json => {
            let str_ins = '<div class="card-group">';
            let i = 0;
            json.dados.forEach(element => {
                let str_card =
                    '<div class="card" style="cursor:pointer;" onMouseOver="idPagVer(' + i + ');">' +
                    '<a href="pagina.html">' +
                    '<center><img style="width:100%; height:278px;" src="' + element.imagens[0] + '" class="card-img-top" alt="' + element.imagens[0] + '"/></center>' +
                    '</a>' +
                    '<div class="card-body">' +
                    '<h5 class="card-title">' + element.titulo + '</h5>' +
                    '<p class="card-text" style="text-align: justify">' + element.info.substring(0, 250) + '</p>' +
                    '<p class="card-text"><small class="text-muted">' + element.ano + '</small></p>' +
                    '</div>' +
                    '</div>';
                if (i % num_column == 0) {
                    str_ins += '</div>'
                    str_ins += '<div class="card-group">';
                }
                i++;
                str_ins += str_card;
            });
            str_ins += '</div>'
            document.getElementById("fotos").innerHTML = str_ins;
        });
}

/**
 * Gera o código HTML para a lista de edificios do itinerário
 */
function gerarListItenerario() {
    var codHTML = '<ul class="list-group shadow">';
    fetch(fileData())
        .then(response => response.json())
        .then(json => {
            for (let i = 0; i < itinerario.length; i++) {
                codHTML += '<li class="list-group-item">';
                codHTML += '<div class="media align-items-lg-center flex-column flex-lg-row p-3">';
                codHTML += '<div class="media-body order-2 order-lg-1">';
                codHTML += '<h5 class="mt-0 font-weight-bold mb-2">' + json.dados[itinerario[i]].titulo + '</h5>';
                codHTML += '<p class="font-italic text-muted mb-0 small">' + json.dados[itinerario[i]].info.substring(0, 100) + "..." + '</p>';
                codHTML += '<img src="' + json.dados[itinerario[i]].imagens[0] + '" alt="Generic placeholder image" width="200" class="ml-lg-5 order-1 order-lg-2">';
                codHTML += '<div class="d-flex align-items-center justify-content-between mt-1">';
                codHTML += '<h6 class="font-weight-bold my-2"><button class="btn btn-danger" onClick="removeItemIti(' + i + ')">Remover</button></h6>';
                codHTML += '</div>';
                codHTML += '</div>';
                codHTML += '</div></li>';

            }
            codHTML += '</ul>';
            document.getElementById("listaItinerario").innerHTML = codHTML;
        });

}

/**
 * Remove um edificio da lista do itinerário
 * @param {*} i 
 */
function removeItemIti(i) {
    itinerario.splice(i, 1);
    localStorage.setItem("itinerario", itinerario.join('|'));
    gerarListItenerario();
}

/**
 * Faz mostrar a div da lista dos itinerarios e esconde a div do map
 */
function mostrarItinerario() {
    document.getElementById("itinerario").style.display = "block";
    document.getElementById("map").style.display = "none";
    getItinerarios();
    gerarListItenerario();
    document.getElementById("navbar").style.display = "none";
}

/**
 * Faz mostrar a div da map e esconde a div do lista dos itinerarios
 */
function mostraMap() {
    document.getElementById("itinerario").style.display = "none";
    document.getElementById("map").style.display = "block";
    document.getElementById("listaItinerario").innerHTML = "";
    document.getElementById("navbar").style.display = "block";
}

/**
 * Ação para alterar a flag lang para 0, ou seja para português
 */
function langPT(){
    lang = 0;
    mostrarTexto();
}

/**
 * Ação para alterar a flag lang para 1, ou seja para ingles
 */
function langEN(){
    lang = 1;
    mostrarTexto();
}

/**
 * função que seleciona a melhor imagem a ser apresentada de fundo na Home
 */
function ver_window() {
    if (curPag == "Home") {
        var w = window.innerWidth;
        var h = window.innerHeight;
        if (w >= h) {
            // vertical
            document.getElementById("paginainicial").style.backgroundImage = "url(../img/abrantes.png)";
            document.getElementById("linguas").style.left = "83%"
            document.getElementById("linguas").style.top = "-32%"
        }
        else {
            // horizontal
            document.getElementById("paginainicial").style.backgroundImage = "url(../img/abrantes1.png)";
        }
    }
}


//define o evento a ser executado quando se redimensiona o ecrâ
window.addEventListener('resize', ver_window);

// define o evento a ser executado quando o cordova está pronto a correr
document.addEventListener('deviceready', onDeviceReady, false);

//faz uma chamada a função "getLocation()" a cada 1s
setInterval(getLocation, 1000);

//função que importa o texto do ficheiro json
function mostrarTexto() {
    fetch("dados.json")
        .then(response => response.json())
        .then(data => {
            getStudents(data.Informacoes.slice(0, 5));
            ////////////////
            document.getElementById("titulo1").innerHTML = data.Informacoes[14].titulo;
            document.getElementById("subtitulo1").innerHTML = data.Informacoes[14].subtitulo;
            document.getElementById("btnExplore").innerHTML = data.Informacoes[13].titulo;
            document.getElementById("btnAbout").innerHTML = data.Informacoes[13].subtitulo;
            document.getElementById("tituloF").innerHTML = data.Informacoes[9].titulo;
            document.getElementById("subtituloF").innerHTML = data.Informacoes[9].subtitulo;


        })
}

function getStudents(data) {
    const imageElements = document.querySelectorAll(".column img");
    const h2Elements = document.querySelectorAll(".column h2");
    const p1Elements = document.querySelectorAll(".column .title");
    const p2Elements = document.querySelectorAll(".column #email");

    
    for (let index = 0; index < 5; index++) {
        if (index < imageElements.length) {
            const student = data[index];

            imageElements[index].src = student.imagens[0];
            imageElements[index].alt = student.nome;

            h2Elements[index].textContent = student.nome;
            p1Elements[index].textContent = "Nº " + student.numero;
            p2Elements[index].textContent = student.email;
        }
    }
}

function fileData() {
    if (lang == 0) {
        return "dados.json"
    } else {
        return "dados_ingles.json"
    }
}

mostrarTexto();
