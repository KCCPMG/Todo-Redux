var notificationDiv;

function initializeSocket(id){
  var socket = io();
  let self_id = id;
  socket.emit('declareId', {userId : self_id});
  socket.on('message', function(message){
    console.log(message);
    // Stub
  })
  console.log("self_id: " + self_id);

  socket.on('new-message', function(task){
    $('#notification-icon').css({color: "purple"})
    let notification_str 

    displayPopupNotification(`You `)
  })

  socket.on('delete-task', function(task){
    // $('#notification-icon').css({color: "purple"})
    console.log('taskSocket.js - task was deleted: ', task);
    // Stub
  })

  socket.on('task-edit', function(task){
    // $('#notification-icon').css({color: "purple"})
    console.log('taskSocket.js - task was edited: ', task);
    // Stub
  })

  socket.on('new-task', function(task){
    // $('#notification-icon').css({color: "purple"})
    console.log('taskSocket.js - task was created: ', task);
  })

  return socket;
}

function displayPopupNotification(text){
  let popup = $('<div/>', {
    class: 'popup-notification'
  })
  popup.text(text);


  if (notificationDiv.children().length > 0) {
    popup.insertBefore(notificationDiv.children()[0])
  } else notificationDiv.append(popup);



  setTimeout(function(){
    // popup.addClass('unrender');
    popup.animate({ opacity: 0 }, {duration: 1000});
    setTimeout(function(){
      popup.remove();
    },1100)
  },7000)
}

$('document').ready(function(){
  notificationDiv = $('<div/>', {
    id: 'notification-div'
  })
  $('body').append(notificationDiv);
  // displayPopupNotification('butts');
})
