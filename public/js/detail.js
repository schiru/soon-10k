((SOON) => {
	document.addEventListener("DOMContentLoaded", function() {
		if (!SOON) return;

		if (SOON.countdownEndTime) {
			SOON.countdownInterval = setInterval(updateCountdown, 1000);
			document.querySelector('#cd-server').style.display = 'none';
			updateCountdown();
			setEndingAt(SOON.countdownEndTime);
		}
	});

	var pluralify = (num, word) => {
		return `${num} ${word}` + (num > 1 || num == 0 ? 's' : '');
	};

	var updateCountdown = () => {
		let cd = calcCountdown();

		if (cd) {
			cd.secText = pluralify(cd.sec, 'second');
			cd.minText = pluralify(cd.min, 'minute');
			cd.hrsText = pluralify(cd.hrs, 'hour');

			let onlySecondsVisible = true;

			let minutesString = '';
			if (cd.min != 0) {
				onlySecondsVisible = false;
				minutesString = cd.minText;
			}
			document.querySelector("#cd-m").innerHTML = minutesString;

			let hoursString = '';
			if (cd.hrs != 0) {
				hoursString = cd.hrsText + (onlySecondsVisible ? '' : ',');
				onlySecondsVisible = false;
			}
			document.querySelector("#cd-h").innerHTML = hoursString;

			let secondsString = (onlySecondsVisible ? '' : ' and ') + cd.secText + ' left';
			document.querySelector("#cd-s").innerHTML = secondsString;

			document.querySelector('.bar .label').innerHTML = calcPercentage(SOON.countdownStartTime, SOON.countdownEndTime)+'%';

			if (cd.sec == 0 && cd.min == 0 && cd.hrs == 0) {
				clearInterval(SOON.countdownInterval);
				setTimeout(() => {location.reload()}, 1000);
				return;
			}
		}
	};

	var calcCountdown = () => {
		let cd = null;
		let end = new Date(SOON.countdownEndTime);
		let now = new Date();
		let fl = Math.floor;
		let diff = fl((end - now)/1000);

		if (typeof diff == 'number' && diff >= 0) {
			cd = {
				sec: fl(diff % 60),
				min: fl((diff/60) % 60),
				hrs: fl(diff/(60*60) % 24),
			};
		}

		return cd;
	}

	var calcPercentage = function(start, end) {
		let p = 0;
		let cDiff = end - new Date().getTime();
		let tDiff = end - start;
		if (tDiff > 0 && cDiff < tDiff) {
			p = 100 - (100*(cDiff/tDiff));
			p = Math.floor(p);
			p = p > 100 ? 100 : p;
		}
		return p;
	}

	var setEndingAt = function(endTimestamp) {
		var ld = new Date(endTimestamp);
		var time = ld.toTimeString().split(' ')[0]
		document.querySelector('#end > span').innerHTML = ld.toDateString()+', '+time;
	}
})(SOON);
