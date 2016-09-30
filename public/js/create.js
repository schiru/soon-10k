document.addEventListener("DOMContentLoaded", function() {
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
    tzInp.value = (!isNaN(tmpDate.getTime())) ? getTzOff(tmpDate) : getTzOff(new Date());
  }

  function getDateTimeString(dateString, timeString) {
  	return (timeString != '') ? dateString+'T'+timeString : dateString;
  }

});
