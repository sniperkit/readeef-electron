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

window.addEventListener("load", function() {
	document.body.addEventListener('open-link', function(event) {
		event.preventDefault();
		shell.openExternal(event.detail);
	});
});

window.moment = moment;
