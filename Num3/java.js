var array = [];
var string = "";
console.log(string);

function myFunction(){  
    if (array.length == 0){
        alert("Ningun numero ingresado, no se puede sumar")
    }
    else{
    var text = array.reduce(function (accumulator, currentValue) {
  return accumulator + currentValue
}, 0); 
   alert("suma de los numeros = "+text);
    }
 }

function CleanInputs(){
    document.getElementById("num").value = "";

    string = "";
    console.log(string);
    array = [];
}
function Siguente(){
    var curr = document.getElementById("num").value;
    if (curr == "69420"){
        document.getElementById("myAudio").play()
           secret()
    }
    if (curr == ""){
        alert("Porfavor ingresar un numero")
    }
    else{
             array.push(parseFloat(curr));
         }
    document.getElementById("num").value = "";
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

function Max(){
    if (array.length == 0){
        alert("Ningun numero ingresado, no se puede sacar el mayor")
    }
    else{        
    var max = array.reduce(function(a, b) {
    return Math.max(a, b);
});
    alert("numero maximo = "+max)
    }
}