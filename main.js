const electron = require('electron')
const {app, BrowserWindow, ipcMain, crashReporter} = electron;
var Datauri = require('datauri');
var storage = require('./storage');
var checker = require('./url-checker');
var menu = require('./menu');
var pkg = require('./package.json');

// Report crashes to our server.
crashReporter.start({
		companyName: "Sugr",
		submitURL: "https://github.com/urandom/readeef/issues",
});

var iconuri = new Datauri(__dirname + '/images/readeef-96.png');
var smallIconuri = new Datauri(__dirname + '/images/readeef-32.png');

var readeef = {
	// Keep a global reference of the window object, if you don't, the window will
	// be closed automatically when the JavaScript object is garbage collected.
	mainWindow: null,

	openAboutWindow: function() {
		var info = [
			// https://github.com/corysimmons/typographic/blob/2.9.3/scss/typographic.scss#L34
			'<div style="text-align: center; font-family: \'Helvetica Neue\', \'Helvetica\', \'Arial\', \'sans-serif\'">',
			'<h1>readeef</h1>',
			'<p>',
			'<img src="' + iconuri.content + '"><br>',
			'Version: ' + pkg.version,
			'<br/>',
			'Electron version: ' + process.versions.electron,
			'<br/>',
			'Node.js version: ' + process.versions.node,
			'<br/>',
			'Chromium version: ' + process.versions.chrome,
			'</p>',
			'</div>'
		].join('');
		var aboutWindow = new BrowserWindow({
				height: 380,
				icon: __dirname + '/images/readeef-96.png',
				width: 600
		});
		aboutWindow.loadURL('data:text/html,' + info);
	},
	openConfigWindow: function () {
		var configWindow = new BrowserWindow({
				height: 500,
				icon: __dirname + '/images/readeef-96.png',
				width: 820
		});
		configWindow.loadURL('file://' + __dirname + '/index.html');
	},
	quitApplication: function () {
		app.quit();
	},
	reloadWindow: function () {
		BrowserWindow.getFocusedWindow().reload();
	},
	toggleDevTools: function () {
		BrowserWindow.getFocusedWindow().toggleDevTools();
	},
	toggleFullScreen: function () {
		var focusedWindow = BrowserWindow.getFocusedWindow();
		// Move to other full screen state (e.g. true -> false)
		var wasFullScreen = focusedWindow.isFullScreen();
		var toggledFullScreen = !wasFullScreen;
		focusedWindow.setFullScreen(toggledFullScreen);
	},
	startMainWindow: function() {
		var lastWindowState = storage.get("lastWindowState");
		if (lastWindowState === null) {
			lastWindowState = {
				width: 1024,
				height: 768,
				maximized: false 
			} 
		}
		var windowOptions = {
			x: lastWindowState.x,
			y: lastWindowState.y,
			width: lastWindowState.width, 
			height: lastWindowState.height,
			icon: __dirname + '/images/readeef-96.png',
		};

		// and load the index.html of the app.
		if (storage.get("url")) {
			windowOptions['nodeIntegration'] = false;
			windowOptions['preload'] =  __dirname + '/browser.js';
			readeef.mainWindow = new BrowserWindow(windowOptions);
			readeef.mainWindow.loadURL(storage.get('url'));
		} else {
			readeef.mainWindow = new BrowserWindow(windowOptions);
			readeef.mainWindow.loadURL('file://' + __dirname + '/index.html?initial');
		}


		// Open the DevTools.
		// mainWindow.openDevTools();
		readeef.mainWindow.on('close', function() {
			var bounds = this.getBounds(); 
			storage.set("lastWindowState", {
				x: bounds.x,
				y: bounds.y,
				width: bounds.width,
				height: bounds.height,
				maximized: this.isMaximized()
			});
		});

		// Emitted when the window is closed.
		readeef.mainWindow.on('closed', function() {
			// Dereference the window object, usually you would store windows
			// in an array if your app supports multi windows, this is the time
			// when you should delete the corresponding element.
			readeef.mainWindow = null;
		});
	},
};

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform != 'darwin') {
		app.quit();
	}
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
	readeef.startMainWindow();

	menu.init(readeef);

	ipcMain.on('focus-main-window', function(evt) {
		readeef.mainWindow.focus();
	});

	ipcMain.on('main-window-is-focused', function(evt) {
		evt.returnValue = JSON.stringify({success: true, value: readeef.mainWindow && readeef.mainWindow.isFocused()});
	});

	ipcMain.on('reload-main-window', function(evt) {
		if (readeef.mainWindow) {
			readeef.mainWindow.reload();
		}
	});

	ipcMain.on('restart-main-window', function(evt) {
		var old = readeef.mainWindow;
		readeef.startMainWindow();

		old.close();
	});

	ipcMain.on('get-icon-uri', function(evt) {
		evt.returnValue = JSON.stringify({success: true, value: smallIconuri.content});
	});

});
