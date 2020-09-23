var array = [];
var string = "";
console.log(string);

function myFunction(){  
    var text = array.reduce(function (accumulator, currentValue) {
  return accumulator + currentValue
}, 0); 
   document.getElementById("sumando").innerHTML = text;  
 }

function CleanInputs(){
    document.getElementById("num").value = "";
    document.getElementById("sumando").innerHTML = "0";
    document.getElementById("suma").innerHTML = "0";
    string = "";
    console.log(string);
    array = [];
}
function Siguente(){
    var curr = document.getElementById("num").value;
    if (isNaN(curr) || curr == ""){
             array.push(parseFloat("0"));
             document.getElementById(name).value = "0";
         }
         else{
             array.push(parseFloat(curr));
             if(string == ""){
                string = curr;
             }
             else{
                string = curr + " + " + string;
             }
         }
    document.getElementById("num").value = "";
    document.getElementById("suma").innerHTML = string;
}

function Max(){
    var max = array.reduce(function(a, b) {
    return Math.max(a, b);
});
    document.getElementById("sumando").innerHTML = max;
}