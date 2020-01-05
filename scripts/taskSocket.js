function initializeSocket(id){
  var socket = io();
  let self_id = id;
  socket.emit('declareId', {userId : self_id});
  socket.on('message', function(message){
    console.log(message);
    // Stub
  })
  console.log("self_id: " + self_id);

  socket.on('new-message', function(){
    $('#notification-icon').css({color: "purple"})
  })

  return socket;
}

