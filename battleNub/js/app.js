(function() {
  // Define DOM elements of game boards, gameId and whosTurn
  var gameId =  document.querySelector('#gameId');
  var myShips = $('#myShips');
  var enemyShips = $('#enemyShips');
  var whosTurn = document.getElementById('whosTurn');

  // Define DOM elements of audios and set audios as unloaded
  var audioE = document.getElementById("audioE");
  var audioS = document.getElementById("audioS");
  var audioLoaded = false;
  
  // Store names of all ships in a variable
  var boatsNames = {'5a':"Carrier (length 5)", '4a':"Battleship (length 4)", '3a':"Cruiser (length 3)", '3b':"Submarine (length 3)", '2a':"Destroyer (length 2)"};
  
  // Initiate mySign, myHit, enemyHit and turn
  var mySign = 'X'; 
  var myHit = 0;
  var enemyHit = 0;
  var turn = 'X';

  // Initiate/display the number of sunken boats
  var numberOfSunkenEl = document.getElementById('numberOfSunken');
  var numberOfSunken = 0;
  numberOfSunkenEl.textContent = numberOfSunken;
  
  // Get the placement of boats from local storage
  var ships = JSON.parse(localStorage.getItem("boats"));

  // Get the game id from url or generate a new one
  var gameid = '';
  var rand = (Math.random() * 9999).toFixed(0);
  gameid = (getGameId()) ? getGameId() : rand;
  gameId.textContent = gameid;

  // Specify the pubnub channels
  var channelX = 'battleNubX--'+ gameid; // channel for player with sign "X"
  var channelO = 'battleNubO--'+ gameid; // channel for player with sign "O"
  var channelList = [channelX, channelO]; 
  var channelH = 'battleNubH--'+ gameid; // channel for the information of the players hit and sunken boats

  // Creates a new PubNub instance method
  var uuid = PUBNUB.uuid();
  var pubnub = PUBNUB.init({
      subscribe_key: 'sub-c-bada02fc-15dc-11e6-858f-02ee2ddab7fe',
      publish_key: 'pub-c-bd6700ec-5f52-42c2-9241-79d375376cc8',
      uuid: uuid
  });

  // Play a choosen audio. The value "E" of parameter (t) define explosion audio and "S" water splash.
  this.playAudio = function (t){
      audioE.muted = false;
      audioS.muted = false;
      if(t == "E"){
        audioE.play();
      }else if(t == "S"){
        audioS.play();
      }
  };

  // Subscribe to a channel,
  // Check/display the occupancy of the channel,
  // Display the interaction of the players
  function subscribe(channel) {
    pubnub.subscribe({
    channel: channel,
    connect: play(channel),
    presence: function(m) {
      // Check if the channel is occupied by two players and display the status.
      // Check if a player left the game.
      if(m.uuid === uuid && m.action === 'join') {
        if(m.occupancy < 2) {
          whosTurn.textContent = 'Waiting for your opponent...'; 
        } else if(m.occupancy === 2) {
          mySign = 'O'; 
        } else if(m.occupancy > 2) {
          alert('This game already have two players!');
          myShips.className = 'disabled';
          enemyShips.className = 'disabled';
        }
      }else if(m.action === 'leave'){
        var playerStatus = "Your opponent left the game!"
        var popUpElement = '<div style="width:60vw;height:60vh;background-color:rgba(255,255,255,1);color:black;margin-left:auto;margin-right:auto;margin-top:15vh;"><h3 style="color:orange; font-size:30px; padding-top:12%;">'+playerStatus+'</h3><a href="boats.html"><button style="width:60%; height:20%; font-size:70%;">NEW GAME</button></a><a href="index.html"><button style="width:60%; height:20%; font-size:70%;">MAIN MENU</button></a></div>';
        displayPopup(popUpElement);
      }

      // Enable the game boards when the game has two players
      if(m.occupancy === 2) {
        myShips.className = '';
        enemyShips.className = '';
        displayTurn();
      }

    },
    callback: function(m) {
      // Call the function publishH() when the channel receives data from opponent 
      if(mySign !== m.player){
        publishH(m);
      }

      // Select the DOM element of clicked square
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

      // Check if there are images in the clicked square and empty the content if so
      var imgTagExist = element.find("img").length;
      if(!imgTagExist){
        element.empty();
      }

      // Display whose turn it is
      turn = (turn === 'X') ? 'O' : 'X';
      displayTurn();
    },
  })};

  // Publish the position of clicked square to the players own channel
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
        //console.log("channelH");
      }
    });
  }
  
  // Subscribe to channelH.
  // Check/inform if there was a hit on a boat, if there was a sunken boat and if the game is over.
  function subscribeH(){
    pubnub.subscribe({
    channel: channelH,
    callback: function(m) {
      // Display explosion or water splash according to if there was a hit or not
      if(m.hit){
        $('#audioE_button').click(); // play upp the explosion audio

        // Increase the number of hits of the players
        if(m.player == mySign){
          myHit += 1;
        }else{
          enemyHit += 1; 
        }
        
        // Display explosion animated image
        if(m.player === mySign){
          $('#enemyShips').find("[data-position='"+m.position+"']").append('<img src="http://www.slateman.net/rtype/gifs/rtypes-explosion2.gif" style="width: 10vw;height: 10vw;position: absolute; z-index: 2;margin-left: -5vw;margin-top: -5vw;">');
        }else if(m.player !== mySign){
          $('#myShips').find("[data-position='"+m.position+"']").append('<img src="http://www.slateman.net/rtype/gifs/rtypes-explosion2.gif" style="width: 10vw;height: 10vw;position: absolute; z-index: 2;margin-left: -5vw;margin-top: -5vw;">');
        }
      }else{
        $('#audioS_b').click(); // play upp the water splash audio

        // Display water splash animated image
        if(m.player === mySign){
          $('#enemyShips').find("[data-position='"+m.position+"']").append('<img src="https://daveriskit.files.wordpress.com/2015/02/splash-animated-gif.gif" style="width: 10vw;height: 10vw;position: absolute; z-index: 2;margin-left: -5vw;margin-top: -5vw;">');
        }else if(m.player !== mySign){
          $('#myShips').find("[data-position='"+m.position+"']").append('<img src="https://daveriskit.files.wordpress.com/2015/02/splash-animated-gif.gif" style="width: 10vw;height: 10vw;position: absolute; z-index: 2;margin-left: -5vw;margin-top: -5vw;">');
        }
      }

      // Change the animated images with explostion/water splash PNG images after 2 seconds.
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
      }, 2000);
      
      // Check if there was a sunken boat and inform the players in a popup window if so.
      if(m.sunk){
        // Increase the number of sunken boats
        if(m.player === mySign){
          numberOfSunken = numberOfSunken +1;
          numberOfSunkenEl.textContent = numberOfSunken;
        }
        
        var popUpElement = '<div style="width:60vw;height:20vh;background-color:rgba(255,255,255,1);color:black;margin-left:auto;margin-right:auto;margin-top:15vh;padding:15px;">'+boatsNames[m.boatHit]+" was sunk!"+'</div>';
        displayPopup(popUpElement);
      }
      
      // Close the popup window after 2 seconds.
      setTimeout(function(){ 
        if(!gameover){
            this.hidePopup();
          }
      }, 2000);
      
      // Select the gameover message for respektive players if a player has hit 17 squares
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
      
      // Popup the gameover message if the game is over
      if(gameover){
        var popUpElement = '<div style="width:60vw;height:60vh;background-color:rgba(255,255,255,1);color:black;margin-left:auto;margin-right:auto;margin-top:15vh;"><button  style="float:right; width:25px; height:25px;padding:0;border-radius:0;" onclick="hidePopup()">X</button><h3 style="color:green; font-size:30px; padding-top:12%;">'+winStatus+'</h3><a href="boats.html"><button style="width:60%; height:20%; font-size:70%;">PLAY AGAIN</button></a><a href="index.html"><button style="width:60%; height:20%; font-size:70%;">MAIN MENU</button></a></div>';
        displayPopup(popUpElement);
      }
      
    }
  });
  }
  
  // Publish the information of hit and sunken boat into the common channel (channelH)
  function publishH(m){
    var hit = false;
    var sunk =false;
    var boatHit = "";

    // Check if there was a hit och sunken boat
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

    // Publish the hit and sunken boat into the channelH
    pubnub.publish({
      channel: channelH,
      message: {player: m.player, position: m.position, hit: hit, sunk:sunk, boatHit:boatHit},
      callback: function(m){
        //console.log(m);
      }
    });
  }

  // Get the game id from the URL
  function getGameId(){
    // If the uRL comes with referral tracking queries from the URL
    if(window.location.search.substring(1).split('?')[0].split('=')[0] !== 'id') {
      return null;
    } else {
      return window.location.search.substring(1).split('?')[0].split('=')[1];
    }
  }

  // Inform the players about whose turn it is
  function displayTurn() {
    whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
  }

  // Publish the position of clicked square and load the audios by playing once with muted sound so that the audios will work by clicking buttons using javascript afterward.
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
    
    // Prevent the publishing if it is not the user's turn.
    if (turn !== mySign) return;
    
    publishPosition(mySign, this.dataset.position);

  }

  // Set the game boards with table element
  function play(channel) {
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
        if(channel == channelO){
          cell.onclick = set;
        }
        cell.appendChild(document.createTextNode(''));
        row.appendChild(cell);
        indicator += indicator;

      }
    }
    
    // Choose the placement and display the table
    var shipElement;
    if(channel == channelX){
      shipElement = myShips;
    }else{
      shipElement = enemyShips;
    }
    shipElement.append(board);
    
  }
  
  // Unsubscribe the channels
  function unsubscribe() {
      pubnub.unsubscribe({
        channel: [channelO, channelX, channelH],
        callback: function(m) {
          //console.log(m);
        }
      });
  }
  
  // Subscribe to the channels
  for(key in channelList){
    subscribe(channelList[key]);
  }
  subscribeH();
  
  // Display the choosen placement of the user's boats on the board (My Ships)
  for(key in ships){
    boat = ships[key];
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

  // Display popup window
  function displayPopup(message) {
    $('#popup').empty();
    $('#popup').css("display", "block");
    $('#popup').append(message);
  }
  
  // Close the popup window
  this.hidePopup = function(){
    $('#popup').css("display", "none");
  }

  // Quit the game by unsubscribing to the channels and redirecting to homepage
  this.quitGame = function(e){
    e.preventDefault();
    unsubscribe();
    window.location.href = "index.html";
  }

  if(!ships){
    var popUpElement = '<div style="width:60vw;height:60vh;background-color:rgba(255,255,255,1);color:black;margin-left:auto;margin-right:auto;margin-top:15vh;"><h3 style="color:green; font-size:30px; padding-top:12%;">'+"You haven't placed your boats yet! Please place your boats first!"+'</h3><a href="boats.html"><button style="width:60%; height:20%; font-size:70%;">PLACE BOATS</button></a></div>';
    displayPopup(popUpElement);
  }

})();