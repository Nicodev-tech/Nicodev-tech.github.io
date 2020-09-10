 function myFunction(){  
     var array = [];
     for (var i = 1; i <= 5; i++) {
        var name = "num"+i
        var curr = document.getElementById(name).value;
        //console.log(curr)
         if (isNaN(curr) || curr == ""){
             array.push(parseFloat("0"))
             document.getElementById(name).value = "0";
         }
         else{
             array.push(parseFloat(curr));             
         }
     } 
    var text = array.reduce(function (accumulator, currentValue) {
  return accumulator + currentValue
}, 0); 
   document.getElementById("sumando").innerHTML = text;  
 }

function CleanInputs(){
     for (var i = 1; i <= 5; i++) {
        var name = "num"+i
        document.getElementById(name).value = "";
        //console.log(curr)
                   
         
     }
    document.getElementById("sumando").innerHTML = "0";
}