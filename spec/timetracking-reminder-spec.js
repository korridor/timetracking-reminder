'use babel';

import TimetrackingReminder from '../lib/timetracking-reminder';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('TimetrackingReminder', () => {
  let workspaceElement;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
  });

  describe('After activation (startOnStartup: false)', () => {
    let activationPromise;
    beforeEach(() => {
      waitsForPromise(() => {
        atom.config.set('timetracking-reminder.startOnStartup', false);
        return atom.packages.activatePackage('timetracking-reminder');
      });
    });
    it('should not be started', () => {
      expect(TimetrackingReminder.isActive).toBe(false);
    });
    it('should not init events', () => {
      expect(TimetrackingReminder.isInitialized).toBe(false);
    });
    describe('After timetracking-reminder:start', () => {
      beforeEach(() => {
        atom.commands.dispatch(workspaceElement, 'timetracking-reminder:start');
      });
      it('should be started', () => {
        expect(TimetrackingReminder.isActive).toBe(true);
      });
      it('should init events', () => {
        expect(TimetrackingReminder.isInitialized).toBe(true);
      });
      describe('On window blur', () => {
        beforeEach(() => {
          TimetrackingReminder.onBlurWindow();
        });
        it('should save the current timestamp', () => {
          expect(TimetrackingReminder.blurTime instanceof Date).toBe(true);
        });
        describe('On window focus', () => {
          beforeEach(() => {
            TimetrackingReminder.onFocusWindows();
          });
          it('should remove the blur timestamp', () => {
            expect(TimetrackingReminder.blurTime).toBe(null);
          });
        });
      });
    });
  });
  describe('On activation startOnStartup: true', () => {
    beforeEach(() => {
      waitsForPromise(() => {
        atom.config.set('timetracking-reminder.startOnStartup', true);
        return atom.packages.activatePackage('timetracking-reminder');
      });
    });
    it('should start', () => {
      expect(TimetrackingReminder.isActive).toBe(true);
    });
    it('should init events', () => {
      expect(TimetrackingReminder.isInitialized).toBe(true);
    });
  });
});
