(function() {

  var gameId =  document.querySelector('#gameId');
  var startShips =  document.querySelector('#startShips');
  
  var shipLength = 5;
  var shipOrientation = "h";
  var shipType = 'a';
  
  var boats = {};

  //var uuid = PUBNUB.uuid();
  
  /*var pubnub = PUBNUB.init({
      subscribe_key: 'sub-c-bada02fc-15dc-11e6-858f-02ee2ddab7fe',
      publish_key: 'pub-c-bd6700ec-5f52-42c2-9241-79d375376cc8',
      uuid: uuid
  });*/

  function play() {
    var board = document.createElement('table'),
      indicator = 1,
      i, j,
      row, cell;
    board.border = 1;

    for (i = 1; i < 11; i += 1) {
      row = document.createElement('tr');
      board.appendChild(row);
      for (j = 1; j < 11; j += 1) {
        cell = document.createElement('td');
        cell.dataset.position = i + '-' + j;
        //cell.width = cell.height = '9%';
        cell.align = cell.valign = 'center';
        cell.indicator = indicator;
        cell.setAttribute("onclick", "placeBoat("+i+","+j+")");
        cell.appendChild(document.createTextNode(''));
        row.appendChild(cell);
        //squares.push(cell);
        indicator += indicator;

      }
    }
    
	startShips.appendChild(board);
    
  }
  
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
  
  this.setOrientation = function(ori){
  		shipOrientation = ori;
  }
  
  this.placeBoat = function (i,j){
  		var list = {};
  		var dataP;
  		var positions = [];
  		
  		for(k=0; k<shipLength; k++){
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
  		
  			b = boats[shipLength+shipType];
  			if(b){
          $("table").find("[data-position='"+b['e0'][0]+"']").empty();
  				for(el in b){
  					p = b[el][0];
  					$("table").find("[data-position='"+p+"']").css("background-color", "");
  				}
  			}
  			
  			for(pos in positions){
  				var color;
  				if(shipLength+shipType == "2a"){
  					color="#e6ffb3";
  				}else if(shipLength+shipType == "3a"){
  					color="#ffb3b3";
  				}else if(shipLength+shipType == "3b"){
  					color="#99b3ff";
  				}else if(shipLength+shipType == "4a"){
  					color="gray";
  				}else if(shipLength+shipType == "5a"){
  					color="#ffff80";
  				}
  				//$("table").find("[data-position='"+positions[pos]+"']").css("background-color", color);
  			}
        if(shipOrientation == 'v'){
          $("table").find("[data-position='"+positions[0]+"']").append("<img src='images/"+shipLength+shipType+".png' style='width:"+shipLength+"0vw; z-index: 1;'></img>");
        }else {
          $("table").find("[data-position='"+positions[0]+"']").append("<img src='images/"+shipLength+shipType+"-v.png' style='height:"+shipLength+"0vw; z-index: 1;'></img>");
        }

  			
  			boats[shipLength+shipType] = list;
  			
  			var c = 0;
  			for(key in boats){
  			 c +=1;
  			}
  			
  			if(c === 5){
  				console.log(c);
  				document.getElementById("bButton").disabled = false;
  				document.getElementById("jButton").disabled = false;
  				//$("#bButton").attr('disabled', 'false');
  			}
  }
  

  
  
  this.storeData = function(){
  	localStorage.setItem("boats", JSON.stringify(boats));
  }
  
  play();

})();


//<td data-position="1-4" height="10%" width="10%" align="center" onclick="placeBoat(1,4)" style="/* background-color: rgb(230, 255, 179); *//* padding: 0 0 0 0; *//* margin-top: -50px; */"><img src="images/2a.png" style="width:20vw;height:9vw;z-index: 1;position: absolute;margin-left: -5vw;margin-top: -4.5vw;"><img src="http://cliparts.co/cliparts/gie/qBd/gieqBd8id.png" style="width: 10vw;height: 9vw;position: absolute;z-index: 2;margin-left: -5vw;margin-top: -4.5vw;"></td>