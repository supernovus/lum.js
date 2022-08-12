
Lum.lib(
{
  name: ['uuid','math.uuid'],
},
function() 
{ // The math.uuid package is naughty and exports directly into the Math built-in object.
  // I may fork it and make an updated version that obeys CommonJS convention.
  require('math.uuid');
});
