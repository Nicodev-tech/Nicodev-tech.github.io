var array = [];
var auto;

function myFunction(){  
    if (array.length == 0){
        alert("Ningun Auto ingresado, ingese porfavor alguno")
    }
    else{
    var text = "";

        for(var i = 0; i < array.length; i++){
            text += JSON.stringify(array[i])
        }
   alert(text);
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
    else if(año == "6969" && color == "azulado" && marca == "fitito" && modelo == "f200"){
            secret()
        document.getElementById("myAudio").play()
    }
    auto = {
        "año":año,
        "color":color,
        "marca":marca,
        "modelo":modelo
    };
    alert(JSON.stringify(auto));
    array.push(auto)
   
    document.getElementById("año").value = "";
    document.getElementById("color").value = "";
    document.getElementById("marca").value = "";
    document.getElementById("modelo").value = "";
    
}

function secret(){
     document.getElementById("header").style.color = "black";
    setTimeout(color_change, 200);
           document.getElementById("header").textContent = ":D";
        document.body.background = "jesus.gif";

}

function color_change(){
     document.getElementById("header").style.color = "white";
        setTimeout(secret, 200);

    
}

