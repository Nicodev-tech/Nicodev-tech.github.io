var array = [];
var auto;

function myFunction(){  
    if (array.length == 0){
        alert("Ningun Auto ingresado, ingese porfavor alguno")
    }
    else{
    var text = "";
    document.getElementById("table").innerHTML = "";
        for(var i = 0; i < array.length; i++){
            text += "<tr>";
            text += "<td>"+array[i].año +"</td>";
             text += "<td>"+array[i].color +"</td>";
             text += "<td>"+array[i].marca +"</td>";
             text += "<td>"+array[i].modelo +"</td>";
            text += "</tr>";
        }
        document.getElementById("table").innerHTML += text;
        document.getElementById("table").style.display = "inline-table";
    }
 }


function Siguente(){
    var año = document.getElementById("año").value;
    var color = document.getElementById("color").value;
    var marca = document.getElementById("marca").value;
    var modelo = document.getElementById("modelo").value;
    if(año == "" || color == "" || marca == "" || modelo == ""){
        alert("Quedaron campos vacios, no se puede crear el objeto")
        return
    }
  
    auto = {
        "año":año,
        "color":color,
        "marca":marca,
        "modelo":modelo
    };
   // alert(JSON.stringify(auto));
    array.push(auto)
   
    document.getElementById("año").value = "";
    document.getElementById("color").value = "";
    document.getElementById("marca").value = "";
    document.getElementById("modelo").value = "";
    
}

