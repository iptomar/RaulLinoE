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

var gpsPosition;
var abrantesLat = 39.46332002046439;
var abrantesLong = -8.199677027352164;
var map;
var greenIcon, yellowIcon;

var curPag="none";

var userMarker;
var gpsMarker = false; //boolean que mostra se existe um marker da localização do utilizador

var idPag = -1;

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

function onLoadFotos(){
    var w = window.innerWidth;
    ins_cart(parseInt(w / 350) > 3 ? 3 : parseInt(w / 350));
    curPag = "Fotos";
}

function onLoadMap(){
    navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError);
    curPag = "Map";
}

function onLoadHome(){
    curPag = "Home";
    ver_window();
}

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

function onLoad(){
    curPag = "none";
}

function onBackKeyDown() {
    //fazer código para o botão de voltar a trás
}

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

function addMarkers(){
    fetch("dados.json")
    .then(response => response.json())
    .then(json => {
        var i = 0;
        json.dados.forEach(element => {
            L.marker([element.coordenadas[0], element.coordenadas[1]], { icon: greenIcon }).addTo(map)
                .bindPopup('<a href="pagina.html" style="cursor:pointer;" onMouseOver="idPagVer(' + i + ');">' + element.titulo + '<br>' + '<img src="../img/mais_preto.svg" width="50px" style="margin-left:auto;"/>' + '</a>')
            i++;
        });
    });
}

function onGPSError(error) {
    alert('code: ' + error.code + '\n' +
        'message: ' + error.message + '\n');
}

//Obter a minha localização
function getLocation() {
    if(curPag == "Map"){
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

//função que é chamada quando se atualização as coordenadas do utilizador
function GPSUserCoords(e) {
    gpsPosition = e.coords;
}

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

function ZoomIN() {
    var zoomInButton = document.getElementById('zoom-in-button');
    zoomInButton.addEventListener('click', function () {
        map.setZoom(map.getZoom() + 1);
    });
}

function ZoomOUT() {
    var zoomOutButton = document.getElementById('zoom-out-button');
    zoomOutButton.addEventListener('click', function () {
        map.setZoom(map.getZoom() - 1);
    });
}

function localizacaoAtual(){
    map.setView({lat: gpsPosition.latitude, lng: gpsPosition.longitude});
}

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

function idPagVer(i){
    idPag = i;
    document.cookie = "idPag="+i;
}

function ins_cart(num_column) {
    fetch("dados.json")
        .then(response => response.json())
        .then(json => {
            let str_ins = '<div class="card-group">';
            let i = 0;
            json.dados.forEach(element => {
                let str_card =                    
                    '<div class="card" style="cursor:pointer;" onMouseOver="idPagVer(' + i + ');">' +
                    '<a href="pagina.html">'+
                    '<center><img style="width:100%; height:278px;" src="' + element.imagens[0] + '" class="card-img-top" alt="' + element.imagens[0] + '"/></center>' +
                    '<div class="card-body">' +
                    '<h5 class="card-title">' + element.titulo + '</h5>' +
                    '<p class="card-text" style="text-align: justify">' + element.info.substring(0, 250) + '</p>' +
                    '<p class="card-text"><small class="text-muted">' + element.ano + '</small></p>' +
                    '</div>' +
                    '</a>'+
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

function ver_window(){
    if(curPag == "Home"){
        var w = window.innerWidth;
        var h = window.innerHeight;
        if (w >= h) document.getElementById("imagem_fundo").innerHTML = '<img style="width:' + w + 'px;height:' + h + 'px;" src="img/abrantes.jpg" class="img-fluid" />';
        else document.getElementById("imagem_fundo").innerHTML = '<img style="width:' + w + 'px;height:' + h + 'px;"src="img/abrantes2.PNG" class="img-fluid" />';
    }    
}

window.addEventListener('resize', ver_window);
document.addEventListener('deviceready', onDeviceReady, false);

setInterval(getLocation, 1000);
