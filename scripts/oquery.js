// Object Queries 

var oQuery = {};

oQuery.find = function (query, objarr, single)
{
//  console.log("we're in oQuery.find()");
  var matched = [];
  for (var i in objarr)
  {
//    console.log("iterating item #"+i);
    var item = objarr[i];
    var match = true;
    for (var key in query)
    {
//      console.log("checking value of "+key);
      if (item[key] != query[key])
      {
        match = false;
        break;
      }
    }
    if (match) 
    {
//      console.log("we found a match");
      if (single)
      {
//        console.log("returning the single item");
        return item;
      }
      matched.push(item);
    }
  }
  return matched;
}

