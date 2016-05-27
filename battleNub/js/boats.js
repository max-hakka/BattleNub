(function() {
  // Define DOM element of game board and initiate the variables shipLength, shipOrientation, shipType and boats
  var startShips =  document.querySelector('#startShips');
  var shipLength = 5;
  var shipOrientation = "h";
  var shipType = 'a';
  var boats = {};

  // Create the board for placing the boats
  function createBoard() {
    // Create table element
    var board = document.createElement('table'),
      indicator = 1,
      i, j,
      row, cell;
      board.border = 1;

    // Create cells for the table
    for (i = 1; i < 11; i += 1) {
      row = document.createElement('tr');
      board.appendChild(row);
      for (j = 1; j < 11; j += 1) {
        cell = document.createElement('td');
        cell.dataset.position = i + '-' + j;
        cell.align = cell.valign = 'center';
        cell.indicator = indicator;
        cell.setAttribute("onclick", "placeBoat("+i+","+j+")");
        cell.appendChild(document.createTextNode(''));
        row.appendChild(cell);
        indicator += indicator;
      }
    }
    
    // Display the table
	  startShips.appendChild(board);
  }
  
  // Set/display the selected boat
  this.setLength = function(l, type){
  		shipLength = l;
  		shipType = type;
      var old = $("#"+l+type).siblings(".selected");
      if(old !== undefined){
        old.css("background-image", "url('images/"+old.attr("id")+"-v.png')");
        old.removeClass("selected");
      }
      $("#"+l+type).addClass("selected");
      $("#"+l+type).css("background-image", "url('images/"+l+type+"-selected.png')");
  }
  
  // Set the orientation of the selected boat
  this.setOrientation = function(ori){
  		shipOrientation = ori;
  }

  // Check if the placement of a boat is valid and return null or the positions of squares
  function getPositions(i,j){
      var list = {};
      var dataP;
      // Check if the placement is valid
      for(k=0; k<shipLength; k++){

        // Check if the length of the selected boat exceeds edge of the board
        if(shipOrientation == 'v'){
          if(j+k >10){
            return null;
          }
            dataP = i+'-'+(j+k);
          list['e'+k]=[dataP, false];
        }else{
          if(i+k >10){
            return null;
          }
          dataP = (i+k)+'-'+j;
          list['e'+k]=[dataP, false];
        }

        // Check if the position of any square of the selected boat is occupied by other boats 
        if(boats !== {}){
          for(key in boats){
            if(shipLength+shipType !== key){
              boat = boats[key];
              for(e in boat){
                if(dataP === boat[e][0]){
                  return null;
                }
              }
            }
          }
        }
      }
      return list;
  }

  // Display the selected boat on the board
  function displayBoat(position){
      // Display the selected boat according to it's choosen orientation
      if(shipOrientation == 'v'){
        $("table").find("[data-position='"+position+"']").append("<img src='images/"+shipLength+shipType+".png' style='width:"+shipLength+"0vw; z-index: 1;'></img>");
      }else {
        $("table").find("[data-position='"+position+"']").append("<img src='images/"+shipLength+shipType+"-v.png' style='height:"+shipLength+"0vw; z-index: 1;'></img>");
      }

      // Enable the "START BATTLE" and "JOIN BATTLE" buttons if user has positioned all the boats
      var c = 0;
      for(key in boats){
       c +=1;
      }
      if(c === 5){
        document.getElementById("bButton").disabled = false;
        document.getElementById("jButton").disabled = false;
      }
  }
  
  // Place the selected boat on the board
  this.placeBoat = function (i,j){
  	list = getPositions(i,j);
    if(list !== null){
      // Check if the selected boat already exists on the board and remove it (old one) if so.
      b = boats[shipLength+shipType];
      if(b){
        $("table").find("[data-position='"+b['e0'][0]+"']").empty();
      }

      boats[shipLength+shipType] = list; // Store the newly placed boat in the variable (boats)

      displayBoat(i+"-"+j);
    }
  }
  
  // Store the placement of all boats in the local storage
  this.storeData = function(){
  	localStorage.setItem("boats", JSON.stringify(boats));
  }

  // Return the valid random placement of a boat
  function getRandomPositions(bPositions) {
    if(!bPositions){
      var i = Math.floor((Math.random()*10)+1); // get a random value for row
      var j = Math.floor((Math.random()*10)+1); // get a random value for column
      bPositions = getPositions(i,j);

      // Find a valid placement recursively
      if(bPositions){
        return bPositions;
      }else{
        return getRandomPositions(bPositions);
      }
    }
  }

  // Generate the random placement of all boats and display them on board
  function placeRandomBoats() {
    var boatsID = ["5a", "4a", "3a", "3b", "2a"];
    var boatsOrientation = ["v", "h"];

    // Get the positions of all boats and display them
    for(key in boatsID){
      var bId = boatsID[key];
      shipLength = parseInt(bId.substr(0,1));
      shipType = bId.substr(1);
      shipOrientation = boatsOrientation[Math.floor(Math.random()*boatsOrientation.length)]; // randomly choose the orientation of boat from "boatsOrientation"
      var randomPos = getRandomPositions(null);
      boats[bId] = randomPos;
      var position = randomPos["e0"][0];
      displayBoat(position);
    }
  }

  // Detect shaking of device
  if (window.DeviceMotionEvent) {
    var sensitivity = 25;
    var x1 = 0, y1 = 0, z1 = 0, x2 = 0, y2 = 0, z2 = 0;

    // Listen to the motion of device
    window.addEventListener('devicemotion', deviceMotionHandler, false);

    // Calculate the movement of device every 150 seconds
    // using the values of accelerationIncludingGravity
    setInterval(function () {
        var movement = Math.abs(x1-x2+y1-y2+z1-z2);

        // Check if the shaking is detected
        if (movement > sensitivity) {
            x1 = 0, y1 = 0, z1 = 0, x2 = 0, y2 = 0, z2 = 0;
            boats = {};
            $("table").find("img").remove();
            placeRandomBoats();
        }
        // Update new position
        x2 = x1;
        y2 = y1;
        z2 = z1;
    }, 150);
  } else {
    $("#shaking").text("Your device doesn't support shaking.");
  }

  // Get the movement of device
  function deviceMotionHandler(eventData){
    x1 = eventData.accelerationIncludingGravity.x;
    y1 = eventData.accelerationIncludingGravity.y;
    z1 = eventData.accelerationIncludingGravity.z;
  }
  
  createBoard();

})();