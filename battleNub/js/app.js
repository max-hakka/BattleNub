(function() {

  var gameId =  document.querySelector('#gameId');
  var gameIdQuery = document.querySelector('#gameIdQuery');
  var myShips = $('#myShips');
  var enemyShips = $('#enemyShips');
  var output = document.querySelector('#output');
  var whosTurn = document.getElementById('whosTurn');

  var gameid = '';
  var rand = (Math.random() * 9999).toFixed(0);

  gameid = (getGameId()) ? getGameId() : rand;

  gameId.textContent = gameid; 

  var oppoenetUrl = 'http://people.kth.se/~marang/battleNub/plain.html?id=' +gameid;
  gameIdQuery.innerHTML = '<a href="' +oppoenetUrl+ '" target="_blank">' +oppoenetUrl+ '</a>';

	var channelX = 'battleNubX--'+ gameid;
	var channelO = 'battleNubO--'+ gameid;
	var channelList = [channelX, channelO];
  
  //console.log(': ');

  var uuid = PUBNUB.uuid();
  
  var pubnub = PUBNUB.init({
      subscribe_key: 'sub-c-bada02fc-15dc-11e6-858f-02ee2ddab7fe',
      publish_key: 'pub-c-bd6700ec-5f52-42c2-9241-79d375376cc8',
      uuid: uuid
  });

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
      }

      if(m.occupancy === 2) {
        myShips.className = '';
        enemyShips.className = '';
        startNewGame();
      }

      document.getElementById('you').textContent = mySign;

      // For Presence Explained Section only
      if(document.querySelector('.presence')) {
        showPresenceExamples(m);
      }

    },
    callback: function(m) {
      // Display the move
      if(document.querySelector('#moves')) {
        var movesOutput = document.querySelector('#moves');
        movesOutput.innerHTML =  movesOutput.innerHTML + displayOutput(m);
      }

      // Display the move on the board
      var element;
      if(mySign === "X" && channel === channelX){
      	element = $('#myShips').find("[data-position='" +m.position + "']");
      }else if(mySign === "X" && channel === channelO){
      	element = $('#enemyShips').find("[data-position='" +m.position + "']");
      }else if(mySign === "O" && channel === channelX){
      	element = $('#enemyShips').find("[data-position='" +m.position + "']");
      }else if(mySign === "O" && channel === channelO){
      	element = $('#myShips').find("[data-position='" +m.position + "']");
      }
      
      element.text(m.player);
      console.log(element);

      checkGameStatus(m.player, element);

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
  	console.log(c);
    pubnub.publish({
      channel: c,
      message: {player: player, position: position},
      callback: function(m){
        console.log(m);
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
    console.log('Moves: '+moves);

    score[player] += el.indicator;
    console.log('Score for player, ' + player + ': ' + score[player]);

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
        cell.width = cell.height = 50;
        cell.align = cell.valign = 'center';
        cell.indicator = indicator;
        cell.onclick = set;
        cell.appendChild(document.createTextNode(''));
        row.appendChild(cell);
        squares.push(cell);
        indicator += indicator;

      }
    }
    
    var ships;
    
    if(channel == channelX){
    	ships = document.getElementById('enemyShips');
    }else{
    	ships = document.getElementById('myShips');
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
      console.log('Getting '+count+ ' messages from history...');

      var isReversed = reverseCheck.checked;
      console.log('Reverse: '+isReversed);

      var timespan = (timeCheck.checked) ? timeSelect.value : null;

      getHistory(count, isReversed, timespan);
    }, false);
   }
  

  function getHistory(count, isReversed, timespan) {
    if(timespan) {
      
      var start = (new Date().getTime() - (timespan*60*1000)) * 10000;
      var end = new Date().getTime() * 10000;

      console.log(start, end)

      pubnub.history({
        channel: channel,
        count: count,
        start: start,
        end: end,
        callback: function(messages) {
          messages[0].forEach(function(m){ 
            console.log(m);
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
            console.log(m);
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
    console.appendChild(child);
  }

  if(document.getElementById('quitButton')) {
    var quitButton = document.getElementById('quitButton');
    quitButton.addEventListener('click', function(e) {

      pubnub.unsubscribe({
        channel: channel,
        callback: function(m) {
          console.log(m);
          showPresenceConsole(m);
        }
      });
    });
  }
  
  for(key in channelList){
 		subscribe(channelList[key]);
  }

})();