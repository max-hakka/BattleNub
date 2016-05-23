(function() {

  var gameId =  document.querySelector('#gameId');
  var gameIdQuery = document.querySelector('#gameIdQuery');
  var myShips = $('#myShips');
  var enemyShips = $('#enemyShips');
  var output = document.querySelector('#output');
  var whosTurn = document.getElementById('whosTurn');
  var numberOfSunkenEl = document.getElementById('numberOfSunken');

  var audioLoaded = false;
  
  var boatsNames = {'5a':"Carrier (length 5)", '4a':"Battleship (length 4)", '3a':"Cruiser (length 3)", '3b':"Submarine (length 3)", '2a':"Destroyer (length 2)"};
  
  var myHit = 0;
  var enemyHit = 0;
  var numberOfSunken = 0;
  numberOfSunkenEl.textContent = numberOfSunken;
  
  ships = JSON.parse(localStorage.getItem("boats"));

  var gameid = '';
  var rand = (Math.random() * 9999).toFixed(0);

  gameid = (getGameId()) ? getGameId() : rand;

  gameId.textContent = gameid; 

  var oppoenetUrl = 'http://people.kth.se/~marang/battleNub/plain.html?id=' +gameid;
  //gameIdQuery.innerHTML = '<a href="' +oppoenetUrl+ '" target="_blank">' +oppoenetUrl+ '</a>';

	var channelX = 'battleNubX--'+ gameid;
	var channelO = 'battleNubO--'+ gameid;
	var channelList = [channelX, channelO];
	var channelH = 'battleNubH--'+ gameid;
  
  //console.log(': ');

  var uuid = PUBNUB.uuid();
  
  var pubnub = PUBNUB.init({
      subscribe_key: 'sub-c-bada02fc-15dc-11e6-858f-02ee2ddab7fe',
      publish_key: 'pub-c-bd6700ec-5f52-42c2-9241-79d375376cc8',
      uuid: uuid
  });

  var audioE = document.getElementById("audioE");
  var audioS = document.getElementById("audioS");

  this.playAudio = function (t){
      audioE.muted = false;
      audioS.muted = false;
      if(t == "E"){
        audioE.play();
      }else if(t == "S"){
        audioS.play();
      }
  };

  function displayOutput(m) {
    if(!m) return;
    return '<li><strong>' +  m.player + '</strong>: ' + m.position + '</li>';
  }

  /*
   * Tic-tac-toe
   * Based on http://jsfiddle.net/5wKfF/378/
   * Multiplayer feature with PubNub
   */


  var mySign = 'X'; 
function subscribe(channel) {
  pubnub.subscribe({
    channel: channel,
    connect: play(channel),
    presence: function(m) {
      console.log(m);

      if(m.uuid === uuid && m.action === 'join') {
        if(m.occupancy < 2) {
          whosTurn.textContent = 'Waiting for your opponent...'; 
        } else if(m.occupancy === 2) {
          mySign = 'O'; 
        } else if (m.occupancy > 2) {
          alert('This game already have two players!');
          myShips.className = 'disabled';
          enemyShips.className = 'disabled';
        }
      }else if(m.action === 'leave'){
        var playerStatus = "Your opponent left the game!"
        var popUpElement = '<div style="width:60vw;height:60vh;background-color:rgba(255,255,255,1);color:black;margin-left:auto;margin-right:auto;margin-top:15vh;"><h3 style="color:orange; font-size:30px; padding-top:12%;">'+playerStatus+'</h3><a href="boats.html"><button style="width:60%; height:20%; font-size:70%;">NEW GAME</button></a><a href="index.html"><button style="width:60%; height:20%; font-size:70%;">MAIN MENU</button></a></div>';
        $('#popup').empty();
        $('#popup').css("display", "block");
        $('#popup').append(popUpElement);
      }

      if(m.occupancy === 2) {
        myShips.className = '';
        enemyShips.className = '';
        startNewGame();
      }

      // For Presence Explained Section only
      if(document.querySelector('.presence')) {
        showPresenceExamples(m);
      }

    },
    callback: function(m) {
    	console.log(m.position);
    	
    	if(mySign !== m.player){
    		publishH(m);
    	}
    	
      // Display the move
      if(document.querySelector('#moves')) {
        var movesOutput = document.querySelector('#moves');
        movesOutput.innerHTML =  movesOutput.innerHTML + displayOutput(m);
      }

      // Display the move on the board
      var element;
      if(mySign === "X" && channel === channelX){
      	element = $('#enemyShips').find("[data-position='" +m.position + "']");
      }else if(mySign === "X" && channel === channelO){
      	element = $('#myShips').find("[data-position='" +m.position + "']");
      }else if(mySign === "O" && channel === channelX){
      	element = $('#myShips').find("[data-position='" +m.position + "']");
      }else if(mySign === "O" && channel === channelO){
      	element = $('#enemyShips').find("[data-position='" +m.position + "']");
      }
      var imgTagExist = element.find("img").length;
      if(!imgTagExist){
        element.empty();
      }

      turn = (turn === 'X') ? 'O' : 'X';
      whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';

      // this is for Pub/Sub explained section.
      subscribed(m);
    },
  })};

  function publishPosition(player, position) {
  	var c;
  	if (player === "O"){
  	 c = channelO;
  	}else{
  	 c = channelX;
  	}
  	
    pubnub.publish({
      channel: c,
      message: {player: player, position: position},
      callback: function(m){
        console.log("channelH");
      }
    });
  }
  
  function subscribeH(){
  	pubnub.subscribe({
    channel: channelH,
    callback: function(m) {
      console.log(m);
    	if(m.hit){
        //var audio = new Audio('Bomb_Exploding.mp3');
        //audio.play();
        $('#audioE_button').click();     

    		if(m.player == mySign){
    			myHit += 1;
    		}else{
    			enemyHit += 1; 
    		}
    		
    		if(m.player === mySign){
          $('#enemyShips').find("[data-position='"+m.position+"']").append('<img src="http://www.slateman.net/rtype/gifs/rtypes-explosion2.gif" style="width: 10vw;height: 10vw;position: absolute; z-index: 2;margin-left: -5vw;margin-top: -5vw;">');
    			$('#enemyShips').find("[data-position='"+m.position+"']").css("color", "#D00000");
    		}else if(m.player !== mySign){
          $('#myShips').find("[data-position='"+m.position+"']").append('<img src="http://www.slateman.net/rtype/gifs/rtypes-explosion2.gif" style="width: 10vw;height: 10vw;position: absolute; z-index: 2;margin-left: -5vw;margin-top: -5vw;">');
    			$('#myShips').find("[data-position='"+m.position+"']").css("color", "#D00000");
    		}
    		console.log("explosion");
    	}else{
        $('#audioS_b').click();
    		if(m.player === mySign){
          $('#enemyShips').find("[data-position='"+m.position+"']").append('<img src="https://daveriskit.files.wordpress.com/2015/02/splash-animated-gif.gif" style="width: 10vw;height: 10vw;position: absolute; z-index: 2;margin-left: -5vw;margin-top: -5vw;">');
    		}else if(m.player !== mySign){
          $('#myShips').find("[data-position='"+m.position+"']").append('<img src="https://daveriskit.files.wordpress.com/2015/02/splash-animated-gif.gif" style="width: 10vw;height: 10vw;position: absolute; z-index: 2;margin-left: -5vw;margin-top: -5vw;">');
    		}
    	}

    	

    	setTimeout(function(){ 
        if(m.hit){
          if(m.player === mySign){
            $('#enemyShips').find("[data-position='"+m.position+"']").find("img:last-child").attr('src', 'http://cliparts.co/cliparts/gie/qBd/gieqBd8id.png');
          }else if(m.player !== mySign){
            $('#myShips').find("[data-position='"+m.position+"']").find("img:last-child").attr('src', 'http://cliparts.co/cliparts/gie/qBd/gieqBd8id.png');
          }
        }else{
          if(m.player === mySign){
            $('#enemyShips').find("[data-position='"+m.position+"']").find("img:last-child").attr('src', 'http://idahoptv.org/sciencetrek/topics/water/images/splash.png');
          }else if(m.player !== mySign){
            $('#myShips').find("[data-position='"+m.position+"']").find("img:last-child").attr('src', 'http://idahoptv.org/sciencetrek/topics/water/images/splash.png');
          }
        }
    		$('#enemyShips').find("[data-position='"+m.position+"']").css("background-image", "");
    		$('#myShips').find("[data-position='"+m.position+"']").css("background-image", "");
    	}, 2000);
    	
    	console.log(m.sunk);
    	if(m.sunk){
    		
    		if(m.player === mySign){
    			numberOfSunken = numberOfSunken +1;
    			numberOfSunkenEl.textContent = numberOfSunken;
    		}
    		
    		var popUpElement = '<div style="width:60vw;height:20vh;background-color:rgba(255,255,255,1);color:black;margin-left:auto;margin-right:auto;margin-top:15vh;padding:15px;">'+boatsNames[m.boatHit]+" was sunk!"+'</div>';
    		$('#popup').empty();
        	$('#popup').css("display", "block");
    		$('#popup').append(popUpElement);
    	}
    	
    	setTimeout(function(){ 
    		if(!gameover){
        		$('#popup').css("display", "none");
        	}
    	}, 2000);
    	
    	var winStatus;
    	var gameover = false;
    	if(myHit == 17){
    		winStatus = "Congratulations! You win!";
    		gameover = true;
    		unsubscribe();
    	}else if(enemyHit == 17){
    		winStatus = "You lose!";
    		gameover = true;
    		unsubscribe();
    	}
    	
    	if(gameover){
    		var popUpElement = '<div style="width:60vw;height:60vh;background-color:rgba(255,255,255,1);color:black;margin-left:auto;margin-right:auto;margin-top:15vh;"><button  style="float:right; width:25px; height:25px;padding:0;border-radius:0;" onclick="hidePopup()">X</button><h3 style="color:green; font-size:30px; padding-top:12%;">'+winStatus+'</h3><a href="boats.html"><button style="width:60%; height:20%; font-size:70%;">PLAY AGAIN</button></a><a href="index.html"><button style="width:60%; height:20%; font-size:70%;">MAIN MENU</button></a></div>';
    		$('#popup').empty();
        	$('#popup').css("display", "block");
    		$('#popup').append(popUpElement);
    	}
    	
    }
  });
  }
  
  function publishH(m){
    var hit = false;
    var sunk =false;
    var boatHit = "";
    Loop1:
  	for(key in ships){
  		var boat = ships[key];
  		for(e in boat){
  			if(boat[e][0] === m.position){
  				boatHit = key;
  				boat[e][1] = true;
  				hit = true;
  				for(k in ships[key]){
  					sunk =true;
  					if(!boat[k][1]){
  						sunk =false;
  						break Loop1;
  					}
  				}
  				
  			}
  		}
  	}
    pubnub.publish({
      channel: channelH,
      message: {player: m.player, position: m.position, hit: hit, sunk:sunk, boatHit:boatHit},
      callback: function(m){
        console.log("asdfasfoe");
      }
    });
  }

  function getGameId(){
    // If the uRL comes with referral tracking queries from the URL
    if(window.location.search.substring(1).split('?')[0].split('=')[0] !== 'id') {
      return null;
    } else {
      return window.location.search.substring(1).split('?')[0].split('=')[1];
    }
  }

  var squares = [], 
    EMPTY = '\xA0',
    score,
    moves,
    turn = 'X',
    wins = [7, 56, 448, 73, 146, 292, 273, 84];

  function startNewGame() {
    var i;
    
    turn = 'X';
    score = {'X': 0, 'O': 0};
    moves = 0;
    for (i = 0; i < squares.length; i += 1) {
      squares[i].firstChild.nodeValue = EMPTY;
    }

    whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
  }

  function win(score) {
    var i;
    for (i = 0; i < wins.length; i += 1) {
      if ((wins[i] & score) === wins[i]) {
          return true;
      }
    }
    return false;
  }

  function checkGameStatus(player, el) {
    moves += 1;

    score[player] += el.indicator;
    //console.log('Score for player, ' + player + ': ' + score[player]);

    if (win(score[turn])) {
      alert(turn + ' wins!');
    } else if (moves === 9) {
      alert('Boooo!');
    } else {
      turn = (turn === 'X') ? 'O' : 'X';
      whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
    }
  }

  function set() { 
    if(!audioLoaded){
      audioE.muted = true;
      audioS.muted = true;

      audioE.play();
      audioE.pause();

      audioS.play();
      audioS.pause();
      audioLoaded = true;
    }
    
    if (turn !== mySign) return;

    if (this.firstChild.nodeValue !== EMPTY) return;
    
    publishPosition(mySign, this.dataset.position);

    // this is for Pub/Sub explained section. 
    toBePublished(mySign, this.dataset.position)

  }

  function play(channel) {
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
        cell.width = cell.height = '10%';
        cell.align = cell.valign = 'center';
        cell.indicator = indicator;
        if(channel == channelO){
        	cell.onclick = set;
        }
        cell.appendChild(document.createTextNode(''));
        row.appendChild(cell);
        squares.push(cell);
        indicator += indicator;

      }
    }
    
    var ships;
    
    if(channel == channelX){
    	ships = document.getElementById('myShips');
    }else{
    	ships = document.getElementById('enemyShips');
    }
	ships.appendChild(board);
    
    startNewGame();
  }

  /*
   * Pub/Sub Explained section
   */

  function toBePublished(player, position) {
    if(!document.getElementById('pubPlayer')) return;

    document.getElementById('pubPlayer').textContent = '"' + player + '"';
    document.getElementById('pubPosition').textContent = '"' + position + '"';
  }
  function subscribed(m) {
    if(!document.getElementById('subPlayer')) return;

    document.getElementById('subPlayer').textContent = '"' + m.player + '"';
    document.getElementById('subPosition').textContent = '"' + m.position + '"';
  }
   
  /*
   * History API Explained section
   */

  if(document.getElementById('history')) {
    var showResultButton = document.getElementById('showResultButton');
    var select = document.getElementById('count');
    var reverseCheck = document.getElementById('reverse');
    var timeCheck = document.getElementById('time');
    var timeSelect = document.getElementById('timeSpan');

    timeCheck.addEventListener('change', function(e) {
      if(timeCheck.checked) {
        timeSelect.hidden = false;
        reverseCheck.disabled = true;
      } else {
        timeSelect.hidden = true;
        reverseCheck.disabled = false;
      }
    });

    showResultButton.addEventListener('click', function(e) {
      output.innerHTML = '';

      var count = select.options[select.selectedIndex].value;
      //console.log('Getting '+count+ ' messages from history...');

      var isReversed = reverseCheck.checked;
      //console.log('Reverse: '+isReversed);

      var timespan = (timeCheck.checked) ? timeSelect.value : null;

      getHistory(count, isReversed, timespan);
    }, false);
   }
  

  function getHistory(count, isReversed, timespan) {
    if(timespan) {
      
      var start = (new Date().getTime() - (timespan*60*1000)) * 10000;
      var end = new Date().getTime() * 10000;

      //console.log(start, end)

      pubnub.history({
        channel: channel,
        count: count,
        start: start,
        end: end,
        callback: function(messages) {
          messages[0].forEach(function(m){ 
            //console.log(m);
            output.innerHTML =  output.innerHTML + displayOutput(m);
          });
        }
      });

    } else {
      pubnub.history({
        channel: channel,
        count: count,
        reverse: isReversed,
        callback: function(messages) {
          messages[0].forEach(function(m){ 
            //console.log(m);
            output.innerHTML =  output.innerHTML + displayOutput(m);
          });
        }
      });
    }

  }

  /*
   * Presence API Explained section
   */

  function showPresenceExamples(m) {
    showPresenceConsole(m);

    document.querySelector('.presence').classList.remove('two');
    document.querySelector('.presence strong').textContent = m.occupancy;
    document.querySelector('.presence span').textContent = 'player';
    
    if(m.occupancy > 1) {
      document.querySelector('.presence span').textContent = 'players';
      document.querySelector('.presence').classList.add('two');
    }
  }

  function showPresenceConsole(m) {
    var console = document.querySelector('#presenceConsole');
    var child = document.createElement('div');
    var text = document.createTextNode(JSON.stringify(m));
    child.appendChild(text);
    //console.appendChild(child);
  }

  if(document.getElementById('quitButton')) {
    var quitButton = document.getElementById('quitButton');
    quitButton.addEventListener('click', function(e) {
      unsubscribe();
    });
  }
  
  function unsubscribe() {
  	  pubnub.unsubscribe({
        channel: [channelO, channelX,channelH],
        callback: function(m) {
          //console.log(m);
          showPresenceConsole(m);
        }
      });
  }
  
  for(key in channelList){
 		subscribe(channelList[key]);
  }
  
  
  var color;
  for(key in ships){
  	boat = ships[key];
  	for(el in boat){
  		position = boat[el][0];
  		if(key == "2a"){
  			color="#e6ffb3";
  		}else if(key == "3a"){
  			color="#ffb3b3";
  		}else if(key == "3b"){
  			color="#99b3ff";
  		}else if(key == "4a"){
  			color="gray";
  		}else if(key == "5a"){
  			color="#ffff80";
  		}
  		//$('#myShips').find("[data-position='"+position+"']").css("background-color", color);
  	}
    var p1=boat['e0'][0], p2=boat['e1'][0];
    var p1_l=p1.split("-");
    var p2_l=p2.split("-");
    $('#myShips').find("[data-position='"+p1+"']").empty();
    if(p1_l[0]===p2_l[0]){
      $('#myShips').find("[data-position='"+p1+"']").append("<img src='images/"+key+".png' style='width:"+key.substr(0,1)+"0vw; z-index: 1;'></img>");
    }else if(p1_l[1]===p2_l[1]){
      $('#myShips').find("[data-position='"+p1+"']").append("<img src='images/"+key+"-v.png' style='height:"+key.substr(0,1)+"0vw; z-index: 1;'></img>");
    }
  }
  
  this.hidePopup = function(){
  	$('#popup').css("display", "none");
  }
  
  subscribeH();

  this.quitGame = function(e){
    unsubscribe();
    // pubnub.channel_group_remove_group({
    //   callback: function(){console.log("removed channels");},
    //   error: function(){"removed error"},
    //   channel_group: channelO
    // });
    e.preventDefault();
    window.location.href = "index.html";
  }

})();