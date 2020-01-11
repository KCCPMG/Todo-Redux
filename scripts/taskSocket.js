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

  socket.on('delete-task', function(task){
    console.log('taskSocket.js - task was deleted: ', task);
    // Stub
  })

  socket.on('task-edit', function(task){
    console.log('taskSocket.js - task was edited: ', task);
    // Stub
  })

  return socket;
}

