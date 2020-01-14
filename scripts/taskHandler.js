var titleFilterInput;
var textFilterInput;
var tagFilterInput;
var assignedByFilterInput;
var assignedToFilterInput;
var completedFilterInput;
var assignedDateTypeSelector;
var hasSubtasksFilterInput;
var includeSubtasksFilterInput;

var tasks;
var filtered_tasks;
var id;
var known_associates;
var socket;
var lastRenderedTasks=[];


function renderTask(task, id, known_associates, tasks, socket, doNotReanimate) {

  var subs = known_associates.filter((ka) => ka.relationship=="Sub" || ka.relationship=="Collab")

  var supes = known_associates.filter((ka) => ka.relationship=="Supe" || ka.relationship=="Collab")

  let completeBtnStr = task.completed==true ? "Mark As Incomplete" : "Mark As Complete"; 
  
  let task_container = $('<div/>', {
    id: "container-"+task._id,
    class: "task-container"
  })

  let taskbox = $('<div/>', {
    id: "task-"+task._id,
    class: "task"
  })

  taskbox.append(($('<h4/>', {
    class: "task-title"
  })).html('<a href="/task?taskID='+task._id+'">'+task.title+'</a>'))

  taskbox.append(($('<p/>', {
    class: "task-text"
  }).text(task.text)))

  if (task.tags.length > 0) {
    taskbox.append(($('<p/>', {
      class: "task-tags"
    }).text("Tags: " + task.tags.join(" "))))
  }

  if (task.assignedDue) {
    taskbox.append(($('<p/>', {
      class: "task-assigned-due"
    }).text("Due Date: " + task.assignedDue)))
  }

  let ab = $('<p/>', {
    class: "task-assigned-by"
  })
  ab.text("Assigned By: " + getEmail(task.assignedBy, known_associates));
  taskbox.append(ab);

  let at = $('<p/>', {
    class: "task-assigned-to"
  })
  at.text("Assigned To: " + getEmails(task.assignedTo, known_associates).join(", "));
  taskbox.append(at);

  taskbox.append(($('<p/>', {
    class: "task-completed"
  }).text("Completed: " + task.completed)))
  if (task.completed) taskbox.addClass('completed');

  let button_row = $('<div/>', {
    class: "task-button-row"
  });

  let completeBtn = $('<button/>', {
    class: "change-task-button complete-task-button"
  });
  completeBtn.text(completeBtnStr);

  completeBtn.click(function(e){
    let div_id = (e.target.parentElement.parentElement.id);
    let id = div_id.slice(5,);
    let taskCopy = Object.assign({}, tasks.find((el) => el._id == id));

    if (taskCopy.completed==true) taskCopy.completed=false;
    else taskCopy.completed=true;

    socket.emit('task-edit', taskCopy)
  })

  button_row.append(completeBtn);

  if (id==task.assignedBy) {
    let editTaskButton = $('<button/>', {
      class: "edit-task-button"
    });
    editTaskButton.text("Edit Task");
    editTaskButton.click(function(e){
      let div_id = (e.target.parentElement.parentElement.id);
      let taskid = div_id.slice(5,);
      let taskCopy = Object.assign({}, tasks.find((el) => el._id == taskid));
      let self_assigned = Boolean(taskCopy.assignedTo.indexOf(taskid));

      addTaskBox(id, socket, supes, known_associates, subs);
      $('#title').val(taskCopy.title);
      $('#text').val(taskCopy.text);
      $('#tags').val(taskCopy.tags.join(" "));
      $('#assignedTo').val(
        $("#"+div_id+" > .task-assigned-to").text().slice(13)
      );
      $('#metoo-checkbox').attr({'checked': self_assigned});
      $('#assignedDue').val(taskCopy.assignedDue);

      $("#submitButton").unbind('click');
      $("#submitButton").click(function(){
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

        taskCopy.title = $('#title').val();
        taskCopy.text = $('#text').val();
        taskCopy.tags = $('#tags').val().split(" ").filter((el)=>el.length>0);
        taskCopy.assignedTo = ids;
        taskCopy.assignedDue = $('#assignedDue').val();

        removeTaskbox();
        socket.emit('task-edit', taskCopy);
      })
    })

    button_row.append(editTaskButton);
  }

  if (id==task.assignedBy) {
    
    let deleteTaskButton = $('<button/>', {
      class: "delete-task-button"
    }).text("Delete Task")
    .click(function(e){
      let div_id = (e.target.parentElement.parentElement.id);
      let parentid = div_id.slice(5,);
      let parentTaskCopy = Object.assign({}, tasks.find((el)=>el._id == parentid));

      $('body').append($('<div/>', {
        id: 'sheet',
      }))
      let warningBox = $('<div/>',{
        id: 'warning-box',
      }).append($('<h2/>', {}).text('WARNING!'))
      .append($('<p/>', {}).text('Deleting a task CANNOT be undone, and any subtasks will be orphaned. Do you want to continue?'));

      let warningBoxButtonRow = $('<div/>', {
        id: 'warning-box-button-row'
      });

      warningBoxButtonRow.append($('<button/>', {
        id: 'confirm-delete-button'
      }).text('Confirm Delete')
      .click(function(){
        warningBox.remove();
        $('#sheet').remove();
        socket.emit('delete-task', task._id);
      }));

      warningBoxButtonRow.append($('<button/>', {
        id: 'cancel-delete-button'
      }).text('Cancel Delete')
      .click(function(){
        warningBox.remove();
        $('#sheet').remove();
      }));

      warningBox.append(warningBoxButtonRow);
      $('body').append(warningBox);

    });

    button_row.append(deleteTaskButton);
  }

  let addSubtaskButton = $('<button/>', {
    class: "add-subtask-button"
  })
  addSubtaskButton.text("Add Subtask")
  addSubtaskButton.click(function(e){
    let div_id = (e.target.parentElement.parentElement.id);
    let parentid = div_id.slice(5,);
    let parentTaskCopy = Object.assign({}, tasks.find((el)=>el._id == parentid));

    addTaskBox(id, socket, supes, known_associates, subs);

    $('#tags').val(parentTaskCopy.tags.join(" "));
    $('#assignedTo').val(getEmails(parentTaskCopy.assignedTo, known_associates));

    $("#submitButton").unbind('click');
    $("#submitButton").click(function(){
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
      if ($('#metoo-checkbox')[0].checked) {
        ids.push(id)
      };

      let subTask = {};
      subTask.title = $('#title').val();
      subTask.text = $('#text').val();
      subTask.tags = $('#tags').val().split(" ").filter((el)=> el.length>0);
      subTask.assignedTo = ids;
      subTask.assignedBy = id;
      subTask.assignedDue = $('#assignedDue').val();
      subTask.parentTask = parentid;

      removeTaskbox();
      let emitObj = {
        parentTask: parentTaskCopy,
        subTask
      }
      socket.emit('new-subtask', emitObj)
    })
  })
  button_row.append(addSubtaskButton);
  taskbox.append(button_row);

  if (task.subTasks.length>0) {
    let hasSubtasks = false;
    for (let st_id of task.subTasks) {
      if (tasks.find((t)=>t._id==st_id)) {
        expand_subtasks = (renderShowSubTasks(task, id, known_associates, tasks, socket));
        hasSubtasks=true;
        break;
      }
      
    }
    if(!hasSubtasks) expand_subtasks = ($('<div/>', {
      class: 'expand-subtasks-control'
    }))
  } else expand_subtasks = ($('<div/>', {
    class: 'expand-subtasks-control'
  }))
  

  let subtasks_container = $('<div/>', {
    class: "subtasks-container"
  })

  task_container.append(taskbox);
  task_container.append(subtasks_container);

  if (task.showChildren) {
    console.log(task.title, "should show children")
    for (let st_id of task.subTasks) {
      if (tasks.find((t)=>t._id==st_id)) {
        subtask = tasks.find((t)=>t._id==st_id);
        renderedSubtask = renderTask(subtask, id, known_associates, tasks, socket, true);
        expand_subtasks = renderCollapseSubTasks(task, id, known_associates, tasks, socket)
        subtasks_container.append(renderedSubtask);
      }
    }
  }

  taskbox.append(expand_subtasks);

  if (!doNotReanimate) task_container.addClass('animate-task')
  return task_container;
}


function getIdFromEmail(email, known_associates) {
  let ka = known_associates.find((el)=>el.email == email);
  if (ka==undefined) return email
  else return ka;
}


function getTaskEl(id) {
  id_str = "container-" + id;
  return $(document.getElementById(id_str));
}


function getTaskFromEl(el, tasks) {
  let taskid = el.id.slice(10);
  return tasks.find((t)=>t._id==taskid);
}


var unknown_associates = [];

function getEmail(userID, known_associates){

  let ka = known_associates.find((el)=>el.id == userID);
  if (ka==undefined) {
    if (!unknown_associates.includes(userID)) unknown_associates.push(userID)
    return '...';
  } else return ka.email;
}


function getEmails(userIDs, known_associates) {
  let arrout = []
  for (let uID of userIDs) {
    arrout.push(getEmail(uID, known_associates));
  }
  return arrout;
}


function updateKnownAssociates(known_associates, unknown_associates, tasks, socket, id){
  promises = [];
  while (unknown_associates.length>0) {
    let ua = unknown_associates.pop();
    promises.push($.ajax({
      url: '/users/'+ua,
      method: 'GET'
    }).done(function(data){
      known_associates.push(data);
    }))
  }

  Promise.all(promises).then(function(){
    let brokenTaskEls = [];
    for (taskEl of document.getElementsByClassName('task')) {
      if ((taskEl.getElementsByClassName("task-assigned-by")[0].textContent).search(/\.\.\./) >-1) {
        brokenTaskEls.push(taskEl.parentElement);
      }
      if ((taskEl.getElementsByClassName("task-assigned-to")[0].textContent).search(/\.\.\./) >-1) {
        brokenTaskEls.push(taskEl.parentElement);
      }
    }
    for (taskEl of brokenTaskEls) {
      $(taskEl).replaceWith(renderTask(getTaskFromEl(taskEl, tasks), id, known_associates, tasks, socket));
    }
  })
}

function renderTaskFilter(tasks_in, filtered_tasks_in, id_in, known_associates_in, socket_in){

  tasks = tasks_in;
  filtered_tasks = filtered_tasks_in;
  id = id_in;
  known_associates = known_associates_in;
  socket = socket_in;

  let taskFilter = $('<div/>', {
    class: 'filter'
  })

  let filterHead = $('<h2/>', {
    class: 'filter-head'
  }).html("Filter &#9660").click(function(){
    showFilter();
  });

  taskFilter.append(filterHead);

  let filterOptions = $('<div/>', {
    class: 'filter-options'
  })

  taskFilter.append(filterOptions);
  filterOptions.hide();

  let titleFilter = $('<div/>', {class: 'task-filter'})
  let titleFilterLabel = $('<label/>', {class: 'task-filter-label'}).text('Title')
  titleFilterInput = $('<input/>', {
    class: 'task-filter-input',
    type: 'text'
  })

  filterOptions.append(((titleFilter.append((titleFilterLabel.append(titleFilterInput))))))
  titleFilterInput.on('input', function(){
    filterTasks(known_associates);
  })

  let textFilter= $('<div/>', {
    class: 'task-filter'
  })
  let textFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Text')
  textFilterInput = $('<input/>', {
    class: 'task-filter-input',
    type: 'text'
  })

  filterOptions.append(((textFilter.append((textFilterLabel.append(textFilterInput))))))
  textFilterInput.on('input', function(){filterTasks(known_associates)})

  let tagFilter = $('<div/>', {
    class: 'task-filter',
    id: 'tag-filter'
  })
  let tagFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text("Tags")
  tagFilterInput = $('<input/>', {
    class: 'task-filter-input',
    type: 'text'
  })

  filterOptions.append(((tagFilter.append((tagFilterLabel.append(tagFilterInput))))))
  tagFilterInput.on('input', function(){filterTasks(known_associates)});

  let assignedByFilter= $('<div/>', {
    class: 'task-filter'
  })
  let assignedByFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Assigned By')
  assignedByFilterInput = $('<input/>', {
    class: 'task-filter-input',
    type: 'text'
  })

  filterOptions.append(((assignedByFilter.append((assignedByFilterLabel.append(assignedByFilterInput))))))
  assignedByFilter.on('input', function(){filterTasks(known_associates)});

  let assignedToFilter = $('<div/>', {
    class: 'task-filter'
  })
  let assignedToFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Assigned To')
  assignedToFilterInput = $('<input/>', {
    class: 'task-filter-input',
    type: 'text'
  })

  filterOptions.append(((assignedToFilter.append((assignedToFilterLabel.append(assignedToFilterInput))))))
  assignedToFilter.on('input', function(){filterTasks(known_associates)});


  let completedFilter= $('<div/>', {
    class: 'task-filter'
  })
  let completedFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Completed')
  completedFilterInput = $('<select/>', {
    class: 'task-filter-input',
  })
  let optionNull = $('<option/>', {value:"--"}).text("--");
  let optionYes = $('<option/>', {value:"Yes"}).text("Yes");
  let optionNo = $('<option/>', {value:"No"}).text("No");

  completedFilterInput.append(optionNull).append(optionYes).append(optionNo);
  completedFilterInput.on('change', function(){
    filterTasks(known_associates);
  })

  filterOptions.append(((completedFilter.append((completedFilterLabel.append(completedFilterInput))))))

  let assignedDateFilter= $('<div/>', {
    class: 'task-filter'
  })
  let assignedDateFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Date')
  assignedDateTypeSelector = $('<select/>', {
    class: 'task-filter-input'
  })
  assignedDateTypeSelector.append(
    $('<option/>', {value:"--"}).text("--")
  );
  assignedDateTypeSelector.append(
    $('<option/>', {value:"Due On"}).text("Due On")
  );
  assignedDateTypeSelector.append(
    $('<option/>', {value:"Due By"}).text("Due By")
  );
  assignedDateTypeSelector.append(
    $('<option/>', {value:"Due After"}).text("Due After")
  );

  let assignedDateFilterInput = $('<input/>', {
    class: 'task-filter-input',
    type: 'date'
  })
  assignedDateFilterLabel.append(assignedDateTypeSelector);
  filterOptions.append(((assignedDateFilter.append((assignedDateFilterLabel.append(assignedDateFilterInput))))))
  assignedDateTypeSelector.on('change', function(){
    filterTasks(known_associates)
  });
  assignedDateFilterInput.on('input', function(){
    filterTasks(known_associates)
  })

  let hasSubtasksFilter= $('<div/>', {
    class: 'task-filter'
  })
  let hasSubtasksFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Has Subtasks?')
  hasSubtasksFilterInput = $('<select/>', {
    class: 'task-filter-input'
  })
  hasSubtasksFilterInput.append(
    $('<option/>', {value:"--"}).text("--")
  );
  hasSubtasksFilterInput.append(
    $('<option/>', {value:"Yes"}).text("Yes")
  );
  hasSubtasksFilterInput.append(
    $('<option/>', {value:"No"}).text("No")
  );
  hasSubtasksFilterInput.on('change', function(){
    filterTasks(known_associates);
  })

  filterOptions.append(((hasSubtasksFilter.append((hasSubtasksFilterLabel.append(hasSubtasksFilterInput))))))

  let includeSubtasksFilter= $('<div/>', {
    class: 'task-filter'
  })
  let includeSubtasksFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Include Subtasks?')
  includeSubtasksFilterInput = $('<select/>', {
    class: 'task-filter-input',
  })

  includeSubtasksFilterInput.append(
    $('<option/>', {value:"--"}).text("--")
  );
  includeSubtasksFilterInput.append(
    $('<option/>', {value:"Yes"}).text("Yes")
  );
  includeSubtasksFilterInput.append(
    $('<option/>', {value:"No", selected: true}).text("No")
  );
  includeSubtasksFilterInput.on('change', function(){
    filterTasks(known_associates);
  })

  filterOptions.append(((includeSubtasksFilter.append((includeSubtasksFilterLabel.append(includeSubtasksFilterInput))))))

  function showFilter(){
    filterOptions.show();
    filterHead.html("Filter &#9650")
    filterHead.click(function(){
      collapseFilter();
    })
  }

  function collapseFilter(){
    filterOptions.hide();
    filterHead.html("Filter &#9660")
    filterHead.click(function(){
      showFilter();
    })
  }

  filterTasks();
  return taskFilter;
}


function renderTasks(filtered_tasks, id, known_associates, all_tasks, socket) {
  let renderedTasks = [];
  for (let task of filtered_tasks) {
    renderedTasks.push(renderTask(task, id, known_associates, all_tasks, socket));
  }
  if (renderedTasks == []) return "No Tasks to Display";
  else return renderedTasks;
}


function renderShowSubTasks(parentTask, self_id, known_associates, tasks, socket){
  let row = $('<div/>',{
    class: 'show-subtasks expand-subtasks-control'
  })
  .text('+ Show Subtasks +')
  .click(function(){
    showSubTasks(parentTask, $(this), self_id, known_associates, tasks, socket);
  });
  return row;
}

function renderCollapseSubTasks(parentTask, self_id, known_associates, tasks, socket){
  let row = $('<div/>',{
    class: 'collapse-subtasks expand-subtasks-control'
  })
  .text('- Collapse Subtasks -')
  .click(function(){
    collapseSubTasks(parentTask, $(this), self_id, known_associates, tasks, socket);
  });
  return row;
}

function showSubTasks(parentTask, renderedRow, self_id, known_associates, tasks, socket){
  subTaskContainer = getTaskEl(parentTask._id).children('.subtasks-container');

  for (let st_id of parentTask.subTasks) {
    if (tasks.find((t)=>t._id==st_id)) {
      let st = tasks.find((task)=>task._id==st_id);
      let renderedSub = renderTask(st, self_id, known_associates, tasks, socket);
      subTaskContainer.append(renderedSub);
    }
  }
  renderedRow.replaceWith(renderCollapseSubTasks(parentTask, self_id, known_associates, tasks, socket));
  parentTask.showChildren = true;
}

function collapseSubTasks(parentTask, renderedRow, self_id, known_associates, tasks, socket) {
  subTaskContainer = getTaskEl(parentTask._id).children('.subtasks-container');
  subTaskContainer.empty();
  renderedRow.replaceWith(renderShowSubTasks(parentTask, self_id, known_associates, tasks, socket))
  parentTask.showChildren = false;
}


function checkTitle(task) {
  let words = titleFilterInput
  .val()
  .split(' ')
  .filter((s) => s.length>0);
  if (words.length == 0) return true;
  else for (let word of words) {
    if (!task.title.match(new RegExp(word, 'gi'))) {
      return false;
    }
  }
  return true;
}

function checkText(task) {
  let words = textFilterInput
  .val()
  .split(' ')
  .filter((s) => s.length>0);
  if (words.length == 0) return true;
  else for (let word of words) {
    if (!task.text.match(new RegExp(word, 'gi'))) {
      return false;
    }
  }
  return true;
}

function checkTags(task) {
  let taskTags = task.tags.join(" ");
  let words = tagFilterInput
  .val()
  .split(' ')
  .filter((s) => s.length>0);
  if (words.length == 0) return true;
  else for (let word of words) {
    if (!taskTags.match(new RegExp(word, 'gi'))) {
      return false;
    }
  }
  return true;
}

function checkAssignedBy(task) {
  let words = assignedByFilterInput
  .val()
  .split(' ')
  .filter((s) => s.length>0);
  if (words.length == 0) return true;
  else for (let word of words) {
    if (!getEmail(task.assignedBy, known_associates).match(new RegExp(word, 'gi'))) {
      return false;
    }
  }
  return true;
}

function checkAssignedTo(task){
  emails = getEmails(task.assignedTo, known_associates).join(' ')
  let words = assignedToFilterInput
  .val()
  .split(' ')
  .filter((s) => s.length>0);
  if (words.length == 0) return true;
  else for (let word of words) {
    if (!emails.match(new RegExp(word, 'gi'))) {
      return false;
    }
  }
  return true;
}

function checkCompleted(task){
  if (completedFilterInput.val()=="--") return true;
  if (completedFilterInput.val()=="Yes") return task.completed;
  if (completedFilterInput.val()=="No") return !task.completed;
}

function checkAssignedDate(task) {
  if (assignedDateTypeSelector.val()=="--") return true;
  if (assignedDateTypeSelector.val()=="Due On") {
    return (task.date==assignedDateFilterInput.val());
  }
  if (assignedDateTypeSelector.val()=="Due By") {
    return (task.date<=assignedDateFilterInput.val());
  }
  if (assignedDateTypeSelector.val()=="Due After") {
    return (task.date>=assignedDateFilterInput.val());
  }
}

function checkSubtasks(task) {
  if (hasSubtasksFilterInput.val()=="--") return true;
  if (hasSubtasksFilterInput.val()=="Yes") {
    return Boolean(task.subTasks.length>0);
  }
  if (hasSubtasksFilterInput.val()=="No") {
    return !Boolean(task.subTasks.length>0);
  }
}

function checkIncludeSubtasks(task) {
  if (includeSubtasksFilterInput.val()=="--") return true;
  if (includeSubtasksFilterInput.val()=="Yes") return true;
  if (includeSubtasksFilterInput.val()=="No") {
    let subtask_ids = [];
    tasks.forEach((t) => subtask_ids.push(t.subTasks));
    subtask_ids = subtask_ids.flat();
    if (subtask_ids.includes(task._id)) return false;
  }
}

function updateTasks(tasks_in) {
  tasks = tasks_in
}


function filterTasks() {
  console.log('taskHandler tasks', tasks)
  filtered_tasks = []
  for (let task of tasks) {
    if (checkTitle(task) == false) continue
    if (checkText(task) == false) continue
    if (checkTags(task) == false) continue
    if (checkAssignedBy(task) == false) continue
    if (checkAssignedTo(task) == false) continue
    if (checkCompleted(task) == false) continue
    if (checkAssignedDate(task) == false) continue
    if (checkSubtasks(task) == false) continue
    if (checkIncludeSubtasks(task) == false) continue
    filtered_tasks.push(task);
  }

  let task_renders = [];
  let rendered_tasks = [];

  for (let task of tasks) {
    if (filtered_tasks.includes(task)) {
      oldTask = lastRenderedTasks.find((t)=>t._id==task._id)
      
      // If task was included
      if (JSON.stringify(oldTask)==JSON.stringify(task)) {
        task_renders.push(renderTask(task, id, known_associates, tasks, socket, true));

      } else {
        task_renders.push(renderTask(task, id, known_associates, tasks, socket));
      }
      rendered_tasks.push(task);

    }
  }

  lastRenderedTasks = [...rendered_tasks];
  $('#task-view').html("");
  for (let rt of task_renders) {
    $('#task-view').append(rt);
  }

  updateKnownAssociates(known_associates, unknown_associates, tasks, socket, id);
}

