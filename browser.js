var electron = require('electron');
var ipc = electron.ipcRenderer;
var shell = electron.shell;
var windowOpen = window.open;
var urlParser = document.createElement('a');

var result = JSON.parse(ipc.sendSync('get-config-item-sync', 'url'));
if (!result || !result.success || !result.value) {
	return;
}

urlParser.href = result.value;
var host = urlParser.hostname;
var notification;

result = JSON.parse(ipc.sendSync('get-config-item-sync', 'show-notifications'));
if (!result || !result.success || result.value === null || result.value) {
	window.addEventListener('updates-available', debounce(function(event) {
		var result = JSON.parse(ipc.sendSync('main-window-is-focused'));
		if (!result || !result.success || result.value) {
			return;
		}

		var opts = { 'body': 'Feed "' + event.detail.title + '" has been updated' };

		result = JSON.parse(ipc.sendSync('get-icon-uri'));
		if (result && result.success && result.value) {
			opts.icon = result.value;
		}

		if (notification) {
			notification.close();
		}

		notification = new Notification('New articles', opts);

		notification.onclick = function() {
			ipc.send('focus-main-window');
		};
	}, 5000));
}

window.addEventListener('pre-article-open', function(event) {
	event.preventDefault();
	shell.openExternal(event.detail.link);
});

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
