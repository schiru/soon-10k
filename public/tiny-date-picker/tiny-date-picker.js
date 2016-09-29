(function() {
  // TODO: use event delegation for better performance

  let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let currentDate = new Date();
  let targetElement = null;
  let dPickerElem = null;

  let container = document.createElement('div');
  let yearContainer = document.createElement('div');
  let monthContainer = document.createElement('div');
  let weekdayContainer = document.createElement('div')
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
    dl.className = 'day-label';

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
    container.appendChild(weekdayContainer);
    container.appendChild(dayContainer);

    yearLabel = new shifter(currentDate.getFullYear(), lsYear, rsYear);
    monthLabel = new shifter(currentDate.getMonth(), lsMonth, rsMonth);

                            console.log("test");
    yearContainer.appendChild(yearLabel);
    monthContainer.appendChild(monthLabel);

    addWeekdayLabels();
    renderDPicker();

    targetElement.parentNode.replaceChild(container, targetElement);
    container.className = 'tiny-date-picker';
  }

  function getTargetElem() {
    return document.querySelector('#tinyDPicker');
  }

  function setLabelText(elem, text) {
    elem.innerHTML = ''+text;
  }

  function addWeekdayLabels() {
    for (var i = 0; i < 7; i++) {
      let label = document.createElement('span');
      label.innerHTML = weekdays[i];
      label.className = 'day-label';
      weekdayContainer.appendChild(label);
    }
  }

  function addDays(currentDate){
    while (dayContainer.firstChild) { // clear container
         dayContainer.removeChild(dayContainer.firstChild);
    }


    let tmp = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // fist day in month
    for (var i = 0; i < tmp.getDay(); i++) {
      let empty = document.createElement('span');
      empty.innerHTML = '-';
      empty.className = 'day-label';
      dayContainer.appendChild(empty);
    }

    tmp = new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 0);
    for (var i = 1; i <= tmp.getDate(); i++) {
      let dl = new dayLabel(i, setDate);
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

  function lsYear() { changeYear(currentDate.getFullYear()-1); }
  function rsYear() { changeYear(currentDate.getFullYear()+1); }

  function renderDPicker() {
    yearLabel.setLabelText(currentDate.getFullYear());
    monthLabel.setLabelText(months[currentDate.getMonth()]);
    addDays(currentDate);
  }

  init();
})();
