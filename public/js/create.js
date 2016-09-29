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
