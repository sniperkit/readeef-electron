const electron = require('electron');
const {ipcRenderer, shell} = electron;
const moment = require('./dist/moment-with-locales.min.js')

const urlParser = document.createElement('a');

var result = JSON.parse(ipcRenderer.sendSync('get-config-item-sync', 'url'));
if (!result || !result.success || !result.value) {
	return;
}

urlParser.href = result.value;
const host = urlParser.hostname;

var notification;
result = JSON.parse(ipcRenderer.sendSync('get-config-item-sync', 'show-notifications'));
if (!result || !result.success || result.value === null || result.value) {
	window.addEventListener('updates-available', debounce(function(event) {
		var result = JSON.parse(ipcRenderer.sendSync('main-window-is-focused'));
		if (!result || !result.success || result.value) {
			return;
		}

		var opts = { 'body': 'Feed "' + event.detail.title + '" has been updated' };

		result = JSON.parse(ipcRenderer.sendSync('get-icon-uri'));
		if (result && result.success && result.value) {
			opts.icon = result.value;
		}

		if (notification) {
			notification.close();
		}

		notification = new Notification('New articles', opts);

		notification.onclick = function() {
			ipcRenderer.send('focus-main-window');
		};
	}, 5000));
}

window.addEventListener('pre-article-open', function(event) {
	event.preventDefault();
	shell.openExternal(event.detail.link);
});

window.moment = moment;

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};
