function addAutocomplete(element, valueArr) {

  function getTop() {
    return element[0].offsetTop + element[0].offsetHeight;
  }
  function getLeft() {
    return element[0].offsetLeft;
  }
  function getWidth() {
    return element[0].offsetWidth;
  }

  function getFontSize() {
    return element.css('font-size'); 
  }
  let auto = $('<div/>', {
    class: 'autocomplete',
  }).css({
    top: getTop(),
    left: getLeft(),
    width: getWidth(),
    fontSize: getFontSize()
  })

  element.after(auto);

  $(window).resize(function(){

    $('.autocomplete').css({
      top: getTop(),
      left: getLeft(),
      width: getWidth(),
      fontSize: getFontSize()
    })
  })

  element.on('input', function(){
    auto.empty();
    let currentWord = element.val().slice(element.val().lastIndexOf(" ")+1, element[0].selectionEnd);
    for (let value of valueArr) {
      if (currentWord.length > 0 && value.email.match(new RegExp(currentWord, 'i'))) {
        let newText = ($('<div/>', {
          class: 'selection-option'
        })).text(value.email);
        auto.append(newText);
      }
    }
    $('.selection-option').click(function(){
      element.val(element.val().slice(0, element.val().lastIndexOf(" ")) + " " + $(this).text());
    })
  })

}

function removeTaskbox(){
  $('#taskBox').remove();
  $('#sheet').remove();
}


function addTaskBox(id, socket, supes, ka, subs){

  $('body').append($('<div/>', {
    id: 'sheet',
  }))

  let taskBox = $('<div/>',{
    id: 'taskBox',
  })

  $('body').append(taskBox);

  let el = ($('<div/>',{
    class: "tb-field-container"
  })).append('<textarea resizable="false" id="title" placeholder="Title"></textarea>');
  taskBox.append(el);

  let text = $('<textarea/>', {
    id: 'text',
    placeholder: 'text',
    rows: 5,
  })
  el = ($('<div/>',{
    class: "tb-field-container"
  })).append(text);
  taskBox.append(el);

  let tags = $('<textarea/>', {
    id: 'tags',
    placeholder: 'tags',
    rows: 2,
  })
  el = ($('<div/>',{
    class: "tb-field-container"
  })).append(tags);
  taskBox.append(el);


  el = $('<div/>',{
    class: "tb-field-container"
  })

  let at = $('<textarea/>', {
    id: "assignedTo",
    placeholder: "Assigned To"
  })
  el.append(at)
  taskBox.append(el);
  addAutocomplete(at, subs);

  el = ($('<div/>',{
    class: "tb-field-container"
  }));
  el.append("Me Too?<input type='checkbox' id='metoo-checkbox' name='metoo' checked>");
  taskBox.append(el);
  
  el = ($('<div/>',{
    class: "tb-field-container"
  })).append('<textarea id="assignedDue" placeholder="assigned due date"></textarea>');
  taskBox.append(el);
  
  let row = $('<div/>',{
    class: "taskbox-button-row"
  })
  row.append('<button id="submitButton" class="taskbox-button">Submit Task</button>');
  row.append('<button id="cancelButton" class="taskbox-button">Cancel Task</button>');
  taskBox.append(row);

  $('#submitButton').click(function(){
    let assignees = $("#assignedTo")
      .val()
      .replace(/ /g, ',')
      .split(',')
      .filter((el) => {if (el!="") return true});
    let ids = [];
    for (let assignee of assignees) {
      for (let sub of subs) {
        if (assignee == sub.email) ids.push(sub.id);
      }
    }
    if ($("#metoo-checkbox")[0].checked){
      ids.push(id);
    }

    socket.emit('new-task', {
      title: $("#title").val(),
      text: text.val(), 
      tags: tags.val().split(" ").filter((el)=>el.length>0),
      assignedTo: ids,
      assignedDue: $("#assignedDue").val(),
    })

    removeTaskbox();
  })

  $('#cancelButton').click(function(){
    removeTaskbox();
  })
}


