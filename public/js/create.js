document.addEventListener("DOMContentLoaded", function() {
  console.log('Ready for takeoff');

  var timeInp = document.querySelector('#time');
  timeInp.addEventListener('keyup', updateTzValue);

  var dateInp = document.querySelector('#date');
  dateInp.addEventListener('keyup', updateTzValue);

  var tzLabel = document.querySelector('#l_tz');
  var tzInp = tzLabel.querySelector('input');
  tzLabel.parentNode.insertBefore(tzLabel, tzLabel.parentNode.firstChild); // move to top for not to mess with css
  tzLabel.style.display = "none";
  updateTzValue();

  function getTzOff(date) {
    return (date.getTimezoneOffset() * -1)/60;;
  }

  function updateTzValue() {
    var tmpDate = new Date(getDateTimeString(dateInp.value, timeInp.value));
    if (!isNaN(tmpDate.getTime())) {
      tzInp.value = getTzOff(tmpDate);
    } else {
      tzInp.value = getTzOff(new Date());
    }
  }

  function getDateTimeString(dateString, timeString) {
  	if (timeString != '') {
  		return dateString+'T'+timeString;
  	} else {
      return dateString
    }
  }

});

(function() {

  let currentDate = new Date();
  let targetElement = null;
  let dPickerElem = null;

  let container = document.createElement('div');
  let yearContainer = document.createElement('div');
  let monthContainer = document.createElement('div');
  let dayContainer = document.createElement('div');

  let yearLabel = document.createElement('span');
  let monthLabel = document.createElement('span');

  let shifter = function(text, leftShiftHandler, rightShiftHandler) {
    let cont = document.createElement('div');
    let ls = document.createElement('span');
    let label = document.createElement('span');
    let rs = document.createElement('span');

    ls.innerHTML = '<';
    label.innerHTML = text;
    rs.innerHTML = '>';

    ls.addEventListener('click', leftShiftHandler);
    rs.addEventListener('click', rightShiftHandler);

    cont.setLabelText = function (text) {
      label.innerHTML = text;
    };

    cont.appendChild(ls);
    cont.appendChild(label);
    cont.appendChild(rs);

    return cont;
  }

  let dayLabel = function(day, clickHandler) {
    let dl = document.createElement('span');
    dl.innerHTML = day;

    dl.addEventListener('click', () => {
      clickHandler(day);
    });

    return dl;
  }


  function init() {
    console.log("init tdp");
    targetElement = getTargetElem();

    container.appendChild(yearContainer);
    container.appendChild(monthContainer);
    container.appendChild(dayContainer);

    yearLabel = new shifter(currentDate.getFullYear(), lsYear, rsYear);
    monthLabel = new shifter(currentDate.getMonth(), lsMonth, rsMonth);

                            console.log("test");
    yearContainer.appendChild(yearLabel);
    monthContainer.appendChild(monthLabel);

    renderDPicker();

    targetElement.parentNode.replaceChild(container, targetElement);
  }

  function getTargetElem() {
    return document.querySelector('#tinyDPicker');
  }

  function setLabelText(elem, text) {
    elem.innerHTML = ''+text;
  }

  function addDays(currentDate){
    while (dayContainer.firstChild) { // clear container
        dayContainer.removeChild(dayContainer.firstChild);
    }

    let tmp = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    for (var i = 0; i < tmp.getDate(); i++) {
      let dl = new dayLabel(i, setDate);
      dl.innerHTML = ''+i;
      dayContainer.appendChild(dl);
    }
  }

  function setDate(day) {
    currentDate.setDate(day);
    console.log(currentDate);
  }

  function changeMonth(month) {
    console.log(month);
    currentDate.setMonth(month);
    console.log(currentDate);
    renderDPicker();
  }

  function lsMonth() { changeMonth(currentDate.getMonth()-1); }
  function rsMonth() { changeMonth(currentDate.getMonth()+1); }

  function changeYear(year) {
    console.log(year);
    currentDate.setFullYear(year);
    console.log(currentDate);
    renderDPicker();
  }

  function lsYear() { changeMonth(currentDate.getFullYear()-1); }
  function rsYear() { changeMonth(currentDate.getFullYear()+1); }

  function renderDPicker() {
    yearLabel.setLabelText(currentDate.getFullYear());
    monthLabel.setLabelText(currentDate.getMonth());
    addDays(currentDate);
  }

  init();
})();
