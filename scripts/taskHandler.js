function renderTask(task) {

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
  ab.text("Assigned By: " + getEmail(task.assignedBy));
  taskbox.append(ab);

  let at = $('<p/>', {
    class: "task-assigned-to"
  })
  at.text("Assigned To: " + getEmails(task.assignedTo).join(", "));
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


      addTaskBox();
      $('#title').val(taskCopy.title);
      $('#text').val(taskCopy.text);
      $('#tags').val(taskCopy.tags);
      $('#assignedTo').val(
        $("#"+div_id+" > .task-assigned-to").text().slice(13)
      );
      $('#metoo-checkbox').attr({'checked': self_assigned});
      $('#assignedDue').val(taskCopy.assignedDue);

      $("#submitButton").unbind('click');
      $("#submitButton").click(function(){
        let assignees = $("#assignedTo")
        .val()
        .replace(/ /g, '')
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


  button_row.append(($('<button/>', {
    class: "delete-task-button"
  }).text("Delete Task")));


  let addSubtaskButton = $('<button/>', {
    class: "add-subtask-button"
  })
  addSubtaskButton.text("Add Subtask")
  addSubtaskButton.click(function(e){
    let div_id = (e.target.parentElement.parentElement.id);
    let parentid = div_id.slice(5,);
    let parentTaskCopy = Object.assign({}, tasks.find((el)=>el._id == parentid));

    addTaskBox();

    $('#tags').val(parentTaskCopy.tags);
    $('#assignedTo').val(getEmails(parentTaskCopy.assignedTo));

    $("#submitButton").unbind('click');
    $("#submitButton").click(function(){
      let assignees = $("#assignedTo")
      .val()
      .replace(/ /g, '')
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

      console.log(subTask);

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

  let et = $('<div/>');
  taskbox.append(et);
  
  if (task.subTasks.length > 0) beExpandable();
  function beExpandable(){
    et.removeClass();
    et.addClass('expand_subtasks');
    et.text('+ Subtasks +');
    et.unbind('click');
    et.click(function(e){
      let div_id = (e.target.parentElement.parentElement.id);
      let id = div_id.slice(5,);
      let task_container = e.target.parentElement.parentElement;
      let task = getTaskFromEl(task_container);
      let subtaskContainer = $(task_container.getElementsByClassName("subtasks-container")[0]);
      for (let st of task.subTasks) {
        let subtask = tasks.find((t)=>t._id == st);
        if (subtask) {
          let rendered = renderTask(subtask);
          subtaskContainer.append(rendered);
        }      
      }
      beCollapsible();
    });
  }

  function beCollapsible() {
    et.removeClass();
    et.addClass('collapse_subtasks');
    et.text('- Collapse -');
    et.unbind('click');
    et.click(function(e){
      let div_id = (e.target.parentElement.parentElement.id);
      let task_container = e.target.parentElement.parentElement;
      let task = getTaskFromEl(task_container);
      let subtaskContainer = $(task_container.getElementsByClassName("subtasks-container")[0])[0];
      subtaskContainer.innerHTML = "";
      beExpandable();
    })
  }

  let subtasks_container = $('<div/>', {
    class: "subtasks-container"
  })

  task_container.append(taskbox);
  task_container.append(subtasks_container);

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


function getTaskFromEl(el) {
  let taskid = el.id.slice(10);
  return tasks.find((t)=>t._id==taskid);
}


// Below is under construction

var unknown_associates = [];

function getEmail(userID){
  let ka = known_associates.find((el) => el.id == userID);
  if (ka==undefined) {
    if (!unknown_associates.includes(userID)) unknown_associates.push(userID)
    return '...';
  } else return ka.email;
}


function getEmails(userIDs) {
  let arrout = []
  for (let uID of userIDs) {
    arrout.push(getEmail(uID));
  }
  return arrout;
}


function updateKnownAssociates(){
  console.log('update known associates');
  console.log('known associates going in', known_associates);

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
    console.log('Broken Tasks', brokenTaskEls);
    for (taskEl of brokenTaskEls) {
      $(taskEl).replaceWith(renderTask(getTaskFromEl(taskEl)));
    }
    console.log('known_associates after promise resolution', known_associates);
  })
}

function updateTags() {
  let tag_list = [];
}

function renderTaskFilter(tasks, tags, filtered_tasks){
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
  let titleFilterInput = $('<input/>', {
    class: 'task-filter-input',
    type: 'text'
  })

  filterOptions.append(((titleFilter.append((titleFilterLabel.append(titleFilterInput))))))
  titleFilterInput.on('input', function(){
    filterTasks();
  })
  


  let textFilter= $('<div/>', {
    class: 'task-filter'
  })
  let textFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Text')
  let textFilterInput = $('<input/>', {
    class: 'task-filter-input',
    type: 'text'
  })


  filterOptions.append(((textFilter.append((textFilterLabel.append(textFilterInput))))))
  textFilterInput.on('input', function(){filterTasks()})
  


  let tagFilter = $('<div/>', {
    class: 'task-filter',
    id: 'tag-filter'
  })
  let tagFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text("Tags")
  let tagFilterInput = $('<input/>', {
    class: 'task-filter-input',
    type: 'text'
  })


  filterOptions.append(((tagFilter.append((tagFilterLabel.append(tagFilterInput))))))
  tagFilterInput.on('input', function(){filterTasks()});
  


  let assignedByFilter= $('<div/>', {
    class: 'task-filter'
  })
  let assignedByFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Assigned By')
  let assignedByFilterInput = $('<input/>', {
    class: 'task-filter-input',
    type: 'text'
  })

  filterOptions.append(((assignedByFilter.append((assignedByFilterLabel.append(assignedByFilterInput))))))
  assignedByFilter.on('input', function(){filterTasks()});

  let assignedToFilter = $('<div/>', {
    class: 'task-filter'
  })
  let assignedToFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Assigned To')
  let assignedToFilterInput = $('<input/>', {
    class: 'task-filter-input',
    type: 'text'
  })

  filterOptions.append(((assignedToFilter.append((assignedToFilterLabel.append(assignedToFilterInput))))))
  assignedToFilter.on('input', function(){filterTasks()});


  let completedFilter= $('<div/>', {
    class: 'task-filter'
  })
  let completedFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Completed')
  let completedFilterInput = $('<select/>', {
    class: 'task-filter-input',
  })
  let optionNull = $('<option/>', {value:"--"}).text("--");
  let optionYes = $('<option/>', {value:"Yes"}).text("Yes");
  let optionNo = $('<option/>', {value:"No"}).text("No");

  completedFilterInput.append(optionNull).append(optionYes).append(optionNo);
  completedFilterInput.on('change', function(){
    filterTasks();
  })

  filterOptions.append(((completedFilter.append((completedFilterLabel.append(completedFilterInput))))))

  let assignedDateFilter= $('<div/>', {
    class: 'task-filter'
  })
  let assignedDateFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Date')
  let assignedDateTypeSelector = $('<select/>', {
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
    filterTasks()
  });
  assignedDateFilterInput.on('input', function(){
    filterTasks()
  })


  let hasSubtasksFilter= $('<div/>', {
    class: 'task-filter'
  })
  let hasSubtasksFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Has Subtasks?')
  let hasSubtasksFilterInput = $('<select/>', {
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
    filterTasks();
  })

  filterOptions.append(((hasSubtasksFilter.append((hasSubtasksFilterLabel.append(hasSubtasksFilterInput))))))

  let includeSubtasksFilter= $('<div/>', {
    class: 'task-filter'
  })
  let includeSubtasksFilterLabel = $('<label/>', {
    class: 'task-filter-label'
  }).text('Include Subtasks?')
  let includeSubtasksFilterInput = $('<select/>', {
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
    filterTasks();
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
      if (!getEmail(task.assignedBy).match(new RegExp(word, 'gi'))) {
        return false;
      }
    }
    return true;
  }

  function checkAssignedTo(task){
    emails = getEmails(task.assignedTo).join(' ')
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


  function filterTasks() {
    filtered_tasks = []
    for (let task of tasks) {
      // let passes_check = true;
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
    updateFilteredTasks(filtered_tasks);
    $('#task-view').html("");
    $('#task-view').append(renderTasks(filtered_tasks, tags));
    updateKnownAssociates();
  }

  filterTasks();
  return taskFilter;
}

function renderTasks(tasks, tags) {
  let renderedTasks = [];
  for (let task of tasks) {
    renderedTasks.push(renderTask(task));
  }
  if (renderedTasks == []) return "No Tasks to Display";
  else return renderedTasks;
}


