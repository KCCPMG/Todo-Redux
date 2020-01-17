// In progress

function addAutocomplete(jElement, stringArr) {
  fontSize = jElement.css('font-size');
  width = jElement.css('width');

  jElement.keydown(function(e){
    let autoDiv =  $('<div/>',{
      class: 'autodiv'
    })
    // Need to listen for resize
    autoDiv.css('display', 'block');
    autoDiv.css('top', jElement[0].offsetTop + jElement[0].offsetHeight);
    autoDiv.css('width', jElement[0].offsetWidth);
    autoDiv.css('left', jElement[0].offsetLeft);
    autoDiv.css('font-size', jElement[0].css('font-size'));
    // autoDiv.css('position')
    jElement.after(autoDiv);


    var cursor = jElement[0].selectionEnd;
    var wordBeginning = jElement.val().slice(0,cursor).lastIndexOf(" ") + 1;

  })
}

