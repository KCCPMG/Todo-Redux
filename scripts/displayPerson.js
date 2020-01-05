function displayPerson(person, self_id, known_associates, socket) {
  let container = $('<div/>', {
    class: 'person-container'
  });

  let name_p = $('<div/>', {
    class: 'display-person-name',
  });
  name_p.text(person.name);
  container.append(name_p);

  let email_p = $('<div/>', {
    class: 'display-person-email',
  });
  email_p.text(person.email);
  container.append(email_p);

  let relationship_p = $('<div/>', {
    class: 'display-person-relationship',
  });
  if (person.relationship) relationship_p.text(person.relationship);
  container.append(relationship_p);

  let button_row = $('<div/>', {
    class: 'display-person-button-row',
  });
  container.append(button_row);

  let message_button = ($('<button/>', {
    class: 'message-button'
  }))
  .text('Message')
  .click(function(){
    displayMessageBox(socket, self_id, known_associates, {
      to: person.email, 
      type: 'message'
    })
  })

  button_row.append(message_button)

  if (known_associates.find((ka) => ka.email == person.email)) {
    person.relationship = known_associates.find((ka) => ka.email == person.email).relationship

    if (person.relationship) {
      relationship_p.text(person.relationship);

      let change_button = ($('<button/>', {
        class: 'change-relationship-button'
      }))
      .text('Change Relationship')
      .click(function(){
        displayChangeRelationship(socket, self_id, known_associates, {
          to: person.email, 
          type: 'Change From ' + person.relationship,
          requires_response: true
        })
      })

      button_row.append(change_button);
    }

  } else {

    let add_supe_button = ($('<button/>', {
      class: 'add-supe-button'
    }))
    .text("Add As Supe")
    .click(function(){
      displayMessageBox(socket, self_id, known_associates, {
        to: person.email, 
        type: 'Add As Supe',
        requires_response: true
      })
    });

    let add_sub_button = ($('<button/>', {
      class: 'add-sub-button'
    }))
    .text("Add As Sub")
    .click(function(){
      displayMessageBox(socket, self_id, known_associates, {
        to: person.email,
        type: 'Add As Sub',
        requires_response: true
      })
    });

    let add_collaborator_button = ($('<button/>', {
      class: 'add-collaborator-button'
    }))
    .text("Add As Collaborator").click(function(){
      displayMessageBox(socket, self_id, known_associates, {
        to: person.email,
        type: 'Add As Collaborator',
        requires_response: true
      })
    });

    button_row.append(add_supe_button)
    .append(add_sub_button)
    .append(add_collaborator_button);
  }

  return container;
}


function displayMessageBox(socket, self_id, known_associates, defaultObj) {

  $('body').append($('<div/>', {
    id: 'sheet',
  }));

  let messageBox = $('<div/>',{
    id: 'message-box',
  });
    
  let messageType = $('<div/>', {
    class: 'mb-field-container',
    id: 'message-type'
  });

  messageBox.append(messageType);

  let mbTo = $('<div/>', {
    class: 'mb-field-container',
    id: 'mb-to'
  });

  messageBox.append(mbTo);

  let mbFrom = $('<div/>', {
    class: 'mb-field-container',
    id: 'mb-from'
  });

  messageBox.append(mbFrom);

  let mbTextContainer = $('<div/>', {
    class: 'mb-field-container',
  })

  let mbText = $('<textarea/>', {
    id: 'message-text',
    rows: 3,
    placeholder: "Message Text"
  })

  mbTextContainer.append(mbText);
  messageBox.append(mbTextContainer);

  let mbButtonRow = $('<div/>', {
    class: 'mb-button-row'
  })

  let mbSendButton = $('<button/>', {
    id: 'mb-send-button',
  }).text('Send');

  let mbCancelButton = $('<button/>', {
    id: 'mb-cancel-button',
  }).text('Cancel');

  mbButtonRow.append(mbSendButton);
  mbButtonRow.append(mbCancelButton);
  messageBox.append(mbButtonRow);

  $('body').append(messageBox);

  if (defaultObj.type != undefined) {
    $('#message-type').text("Type: " + defaultObj.type)
  } else console.log('defaultObj.type test failed');

  if (defaultObj.to) {
    $('#mb-to').text("To: " + defaultObj.to)
  } else console.log('defaultObj.to test failed');
  $('#mb-from').text("From: " + known_associates.find((ka) => ka.id == self_id).email)

  $('#mb-send-button').click(function(){
    let addressees = $('#mb-to')
    .text()
    .slice(4,)
    .replace(/ /g, '')
    .split(',')
    .filter((el) => {if (el!="") return true});

    let sendObj = {
      fromID: self_id,
      to: addressees,
      type: defaultObj.type,
      text: $('#message-text').val(),
      requires_response: typeof defaultObj.requires_response=="undefined" ? false : true,
      original_note: defaultObj.original_note
    }

    socket.emit('new-notification', sendObj)

    $('#sheet').remove();
    $('#message-box').remove();
    console.log('waiting for response');
    socket.on('message-status', function(message){
      console.log(message);
    })
  })


  $('#mb-cancel-button').click(function(){
    $('#sheet').remove();
    $('#message-box').remove();
  })
}

function displayChangeRelationship(socket, self_id, known_associates, defaultObj){
  
  current_relationship = defaultObj.type.slice(12,);

  $('body').append($('<div/>', {
    id: 'sheet',
  }))

  let changeBox = $('<div/>',{
    id: 'change-relationship-box',
  });
  $('body').append(changeBox);

  let changeDescription = $('<div/>', {
    class: 'mb-field'
  }).text(defaultObj.type);
  changeBox.append(changeDescription);

  let buttonRow = $('<div/>', {
    class: 'change-person-button-row'
  });

  if (current_relationship!="Supe") {
    let changeToSupe = $('<button/>', {
      class: 'change-relationship-box-button change-button'
    }).text('Change to Supe')
    .click(function(){
      defaultObj.type = defaultObj.type + " to Supe"
    })
    buttonRow.append(changeToSupe);
  }

  if (current_relationship!="Sub") {
    let changeToSub = $('<button/>', {
      class: 'change-relationship-box-button change-button'
    }).text('Change to Sub')
    .click(function(){
      defaultObj.type = defaultObj.type + " to Sub"
    });
    buttonRow.append(changeToSub);
  }

  if (current_relationship!="Collab") {
    let changeToCollab = $('<button/>', {
      class: 'change-relationship-box-button change-button'
    }).text('Change to Collab')
    .click(function(){
      defaultObj.type = defaultObj.type + " to Collab"
    });
    buttonRow.append(changeToCollab);
  }

  let deleteRelationship = $('<button/>', {
    class: 'change-relationship-box-button'
  }).text('Delete Relationship')
  buttonRow.append(deleteRelationship);

  let cancelButton = $('<button/>', {
    class: 'change-relationship-box-button'
  }).text('Cancel')
  buttonRow.append(cancelButton);

  changeBox.append(buttonRow);

  $('.change-relationship-box-button').click(function(){
    $('#sheet').remove();
    $('#change-relationship-box').remove();
  })

  $('.change-button').click(function(){
    displayMessageBox(socket, self_id, known_associates, defaultObj)
  })

}