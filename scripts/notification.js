function renderNotification(note, self_id, known_associates, unknown_associates, broken_notifications, socket) {

  let responseObj = {
    fromID: self_id,
    to: getEmail(self_id, note.from, known_associates, unknown_associates),
    original_note: typeof note.original_note!='undefined' ? note.original_note : note._id,

  }
  
  var description_string;
  let el = $('<div/>', {
    id: note._id,
    class: 'notification'
  });

  var from_self;

  if (note.from==self_id) {
    description_string = "You sent ";
    from_self = true;
  }
  else {
    description_string = getEmail(self_id, note.from, known_associates, unknown_associates) + " sent ";
    from_self = false;
  }

  description_string += groupNames(getEmails(self_id, note.to, known_associates, unknown_associates)) + " a "

  if (!(note.type == 'message' || note.type == "text reply")) {
    description_string += " request to "

  }

  description_string += note.type;
  description_string += " on ";

  let date = new Date(note.date);
  description_string += date.toDateString() + " at ";
  description_string += date.toLocaleTimeString();

  el.append($('<p/>', {class: "notification-description"}).text(description_string))

  el.append($('<p/>', {class: "notification-text"}).text('"' + note.text + '"'))

  if (description_string.indexOf('...') > -1 && broken_notifications.indexOf(note)==-1){
    broken_notifications.push(note);
  } 

  let notification_button_row;

  if (from_self == false) {
    notification_button_row = $('<div/>', {
      class: 'notification-button-row'
    })
    el.append(notification_button_row);

    let text_respond_button = $('<button/>',{
      class: 'text-response-button response-button'
    }).text('Text Response');
    text_respond_button.click(function(){
      responseObj.type = 'text reply';
      displayMessageBox(socket, self_id, known_associates, responseObj)
    })
    notification_button_row.append(text_respond_button);
  }

  if (note.requires_response==true) {
    let responseDiv = $('<div/>', {
      class: 'response-container'
    });
    el.append(responseDiv);

    if (note.responded_to==true) {
      if (note.accepted==true) responseDiv.text('Accepted');
      else responseDiv.text('Rejected');
    } else {
      if (from_self==false) {
        responseDiv.text('Awaiting Your Response');
        
        let accept_button = $('<button/>', {
          class: 'accept-response-button response-button'
        }).text('Accept Request')
        .click(function(){
          editResponseObj = Object.assign({}, responseObj);
          Object.assign(editResponseObj, {
            type: note.type + ' Accept'
          })

          displayMessageBox(socket, self_id, known_associates, editResponseObj)
        });
        notification_button_row.append(accept_button);

        let reject_button = $('<button/>', {
          class: 'reject-response-button response-button'
        }).text('Reject Request')
        .click(function(){
          editResponseObj = Object.assign({}, responseObj);
          Object.assign(editResponseObj, {
            type: note.type + ' Reject'
          })

          displayMessageBox(socket, self_id, known_associates, editResponseObj)
        });
        notification_button_row.append(reject_button);

      }
      else responseDiv.text('Awaiting Response');
    }
  }
  
  return el;
}


function getEmail(self_id, userID, known_associates, unknown_associates){
  let ka = known_associates.find((el) => el.id == userID);
  if (userID==self_id) return "you"
  if (ka==undefined) {
    if (unknown_associates.includes(userID)==false) unknown_associates.push(userID);
    return '...';
  } else return ka.email;
}

function getEmails(self_id, userIDs, known_associates, unknown_associates) {
  let arrout = [];
  for (let uID of userIDs) {
    arrout.push(getEmail(self_id, uID, known_associates, unknown_associates));
  }
  return arrout;
}

function updateKnownAssociates(broken_notifications, self_id, known_associates, unknown_associates, socket){
  var promises = [];
  while (unknown_associates.length > 0){
    let ua = unknown_associates.pop();
    promises.push($.ajax({
      url: '/users/' + ua,
      method: 'GET'
    }).done(function (data){
      known_associates.push(data)
    }));
  }
  Promise.all(promises).then(function(){
    for (let bn of broken_notifications) {
      let bad_el = $('#'+bn._id);
      bad_el.replaceWith(renderNotification(bn, self_id, known_associates, unknown_associates, broken_notifications, socket));
    }
  })
}

function groupNames(names) {
  if (names.length == 0) return "no one";
  if (names.length == 1) return names[0];
  if (names.length == 2) return names.join(' and ');
  else return names.slice(0, -1).join(', ') + ', and ' + names.slice(-1);
}

function getRenderedNotification(id) {
  return $('#'+id);
}