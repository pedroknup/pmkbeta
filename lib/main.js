'use babel';

import { CompositeDisposable } from 'atom';
import Config from './config';

export default {
  config: Config.settings(),

  activate(state) {
    const _this = this;
    this.prepareSerialPort(error => {
      if (error) {
        const err_mess =
          'There was an error with your serialport module, pmkbeta will likely not work properly. Please try to install again or report an issue on our github (see developer console for details)';
        atom.notifications.addError(err_mess);

        console.log(err_mess);
        console.log(error);
      }

      const pmkbeta = require('./pmkbeta');
      const PanelView = require('./views/panel-view');
      const SettingsWrapper = require('./wrappers/settings-wrapper');

      _this.isDark = false;
      _this.buildStatusBarOnConsume = false;
      _this.settings = new SettingsWrapper(settings => {
        _this.view = new PanelView(
          settings,
          state.viewState,
          null,
          _this.isDark,
        );
        _this.view.addPanel();
        _this.view.build();
        _this.pmkbeta = new pmkbeta(
          state.viewState,
          _this.view,
          settings,
          _this.isDark,
        );
        _this.buildStatusBar();
        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        _this.subscriptions = new CompositeDisposable();
        // Register command that toggles this view
        _this.subscriptions.add(
          atom.commands.add('atom-workspace', {
            'pmkbeta:sync': () => _this.pmkbeta.sync(),
            'pmkbeta:upload': () => _this.pmkbeta.upload(),
            'pmkbeta:upload File': () => _this.pmkbeta.uploadFile(),
            'pmkbeta:toggle REPL': () =>
              _this.pmkbeta.toggleVisibility(),
            'pmkbeta:connect': () => _this.pmkbeta.connect(),
            'pmkbeta:run': () => _this.pmkbeta.run(),
            'pmkbeta:run Selection': () => _this.pmkbeta.runselection(),
            'pmkbeta:help': () => _this.pmkbeta.writeHelpText(),
            'pmkbeta:clear Terminal': () =>
              _this.pmkbeta.clearTerminal(),
            'pmkbeta:disconnect': () => _this.pmkbeta.disconnect(),
          }),
        );
      });
    });
  },

  

  buildStatusBar() {
    const _this = this;
    const div = $('<div></div>').addClass('pmkbeta-status-bar');
    const img = $('<img>')
      .addClass('pmkbeta-logo')
      .attr(
        'src',
        `${this.pmkbeta.api.getPackagePath()}/styles/assets/logo.png`,
      )
      .width('17px');
    div.append(img);
    div.html(`${div.html()} pmkbeta`);

    div.click(() => {
      _this.pmkbeta.toggleVisibility();
    });

    if (this.statusBar)
      this.statusBar.addRightTile({ item: div, priority: 1 });
    else this.buildStatusBarOnConsume = true;
  },

  prepareSerialPort(cb) {
    try {
      require('serialport');
      cb();
    } catch (e) {
      console.log('Error while loading serialport library');
      console.log(e);
    }
  },

  consumeStatusBar(statusBar) {
    this.statusBar = statusBar;
    if (this.buildStatusBarOnConsume) {
      this.buildStatusBar();
    }
  },

  deactivate() {
    this.subscriptions.dispose();
    this.pmkbeta.destroy();
  },

  serialize() {
    const ser = {
      viewState: null,
      feedbackPopupSeen: null,
    };
    if (this.pmkbeta) {
      (ser.viewState = this.pmkbeta.serialize()),
        (ser.feedbackPopupSeen = this.pmkbeta.view.feedback_popup_seen);
    }
    return ser;
  },
};
