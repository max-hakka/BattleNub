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
  
  // Place the selected boat on the board
  this.placeBoat = function (i,j){
  		var list = {};
  		var dataP;
  		var positions = [];
  		
      // Check if the placement is valid
  		for(k=0; k<shipLength; k++){

        // Check if the length of the selected boat exceeds edge of the board
  			if(shipOrientation == 'v'){
  				if(j+k >10){
  					return;
  				}
  			    dataP = i+'-'+(j+k);
  				list['e'+k]=[dataP, false];
  			}else{
  				if(i+k >10){
  					return;
  				}
  				dataP = (i+k)+'-'+j;
  				list['e'+k]=[dataP, false];
  			}
  			positions.push(dataP);

        // Check if the position of any square of the selected boat is occupied by other boats 
  			if(boats !== {}){
  				for(key in boats){
  					if(shipLength+shipType !== key){
  						boat = boats[key];
  						for(e in boat){
  							if(dataP === boat[e][0]){
  								return;
  							}
  						}
  					}
  				}
  			}
  		}
  		
      // Check if the selected boat already exists on the board and remove it (old one) if so.
  		b = boats[shipLength+shipType];
  		if(b){
        $("table").find("[data-position='"+b['e0'][0]+"']").empty();
  		}
  		
      // Display the selected boat on the board
      if(shipOrientation == 'v'){
        $("table").find("[data-position='"+positions[0]+"']").append("<img src='images/"+shipLength+shipType+".png' style='width:"+shipLength+"0vw; z-index: 1;'></img>");
      }else {
        $("table").find("[data-position='"+positions[0]+"']").append("<img src='images/"+shipLength+shipType+"-v.png' style='height:"+shipLength+"0vw; z-index: 1;'></img>");
      }

  		boats[shipLength+shipType] = list; // Store the newly placed boat in the variable (boats)
  		
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
  
  // Store the placement of all boats in the local storage
  this.storeData = function(){
  	localStorage.setItem("boats", JSON.stringify(boats));
  }
  
  createBoard();

})();