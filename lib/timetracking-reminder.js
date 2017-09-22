'use babel';

import { CompositeDisposable } from 'atom';

export default {

  /**
   * Atom config
   * @type {Object}
   */
  config: {
    startOnStartup: {
      title: 'Start on startup',
      type: 'boolean',
      default: true,
      order: 1
    },
    remindOnInactivity: {
      'title': 'Remind on inactivity',
      'type': 'boolean',
      default: true,
      order: 2
    },
    inactivityMinutes: {
      title: 'Inactive minutes',
      type: 'integer',
      default: 15,
      minimum: 1,
      order: 3
    },
    remindOnProjectOpening: {
      title: 'Remind me when openening a project',
      type: 'boolean',
      default: true,
      order: 4
    },
    remindOnProjectClosing: {
      title: 'Remind me when closing a project',
      type: 'boolean',
      default: true,
      order: 5
    },
    pauseProjectChange: {
      title: 'Pause after reminding about opening or closing a project (in seconds)',
      description: 'If you want to disable this behaviour just set the value to 0',
      type: 'integer',
      default: 15,
      minimum: 0,
      order: 6
    }
  },

  subscriptions: null,

  isActive: false,
  isInitialized: false,
  blurTimeout: null,
  blurTime: null,
  paths: null,
  lastRemindOnProjectChange: null,

  /**
   * [activate description]
   * @param  {[type]} state [description]
   * @return {[type]}       [description]
   */
  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'timetracking-reminder:start': (event) => {
        this.start();
      },
      'timetracking-reminder:stop': (event) => {
        this.stop();
      }
    }));
    if(atom.config.get('timetracking-reminder.startOnStartup')) {
      this.start();
    }
  },

  /**
   * [deactivate description]
   * @return {[type]} [description]
   */
  deactivate() {
    this.subscriptions.dispose();
  },

  /**
   * [stop description]
   * @return {[type]} [description]
   */
  stop() {
    this.isActive = false;
  },

  /**
   * [serialize description]
   * @return {[type]} [description]
   */
  serialize() {
  },

  /**
   * [start description]
   * @return {[type]} [description]
   */
  start() {
    if(this.isActive) {
      return;
    }
    this.isActive = true;
    
    if(!this.isInitialized) {
      this.isInitialized = true;
      this.initEvents();
    }
  },

  /**
   * [initEvents description]
   * @return {[type]} [description]
   */
  initEvents() {
    this.paths = atom.project.getPaths();
    atom.project.onDidChangePaths(this.onDidChangePaths);
    atom.getCurrentWindow().on('blur', this.onBlurWindow);
    atom.getCurrentWindow().on('focus', this.onFocusWindows);
  },

  /**
   * [onDidChangePaths description]
   * @param  {[type]} paths [description]
   * @return {[type]}       [description]
   */
  onDidChangePaths(paths) {
    if(!this.isActive) {
      return;
    }
    if(this.lastRemindOnProjectChange && (this.lastRemindOnProjectChange - new Date()) < (1000 * atom.config.get('timetracking-reminder.pauseProjectChange'))) {
      return;
    }

    // get message
    var changes = this.getChangedPaths(this.paths, paths);
    var message = '';
    if(changes.added.length > 0 && atom.config.get('timetracking-reminder.remindOnProjectOpening')) {
      message = 'You opened a project!\nShouldn\'t you start your timestracker?';
    }
    if(changes.removed.length > 0 && atom.config.get('timetracking-reminder.remindOnProjectClosing')) {
      message = 'You closed a project!\nShouldn\'t you stop your timestracker?';
    }
    if(message == '') {
      return;
    }

    this.lastRemindOnProjectChange = new Date();
    setTimeout(() => {
      atom.confirm({
        message: message,
        detailedMessage: 'Current time: ' + ('0' + this.lastRemindOnProjectChange.getHours()).slice(-2) + ':' + ('0' + this.lastRemindOnProjectChange.getMinutes()).slice(-2),
        buttons: {
          OK: () => {
            this.paths = atom.project.getPaths();
          },
        }
      });
    }, 1);
  },

  /**
   * [onBlurWindow description]
   * @return {[type]} [description]
   */
  onBlurWindow() {
    if(!this.isActive) {
      return;
    }
    this.blurTime = new Date();
    this.blurTimeout = setTimeout(() => {
      atom.confirm({
        message: 'You were inactive for more than ' + atom.config.get('timetracking-reminder.inactivityMinutes') + ' minutes!\nShouldn\'t you stop your timestracker?',
        detailedMessage: 'Last activity: ' + ('0' + this.blurTime.getHours()).slice(-2) + ':' + ('0' + this.blurTime.getMinutes()).slice(-2),
        buttons: {
          'Thanks!': () => {
            this.blurTimeout = null;
            this.blurTime = null;
          },
        }
      });
    }, 60000 * atom.config.get('timetracking-reminder.inactivityMinutes'));
  },

  /**
   * [onFocusWindows description]
   * @return {[type]} [description]
   */
  onFocusWindows() {
    if(!this.isActive) {
      return;
    }
    clearTimeout(this.blurTimeout);
    this.blurTimeout = null;
    this.blurTime = null;
  },

  /**
   * [getChangedPaths description]
   * @param  {[type]} oldPaths [description]
   * @param  {[type]} newPaths [description]
   * @return {[type]}          [description]
   */
  getChangedPaths(oldPaths, newPaths) {
    var result = {
      added: [],
      removed: []
    }
    for (var i = 0; i < newPaths.length; i++) {
      if(!this.hasPath(oldPaths, newPaths[i])) {
        result.added.push(newPaths[i]);
      }
    }
    for (var i = 0; i < oldPaths.length; i++) {
      if(!this.hasPath(newPaths, oldPaths[i])) {
        result.removed.push(oldPaths[i]);
      }
    }
    return result;
  },

  /**
   * [hasPath description]
   * @param  {[type]}  paths [description]
   * @param  {[type]}  path  [description]
   * @return {Boolean}       [description]
   */
  hasPath(paths, path) {
    for (var i = 0; i < paths.length; i++) {
      if(paths[i] == path) {
        return true;
      }
    }
    return false;
  }

};
