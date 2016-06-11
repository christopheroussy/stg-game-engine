/**
 * Finite state machine FSM.
 * 
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  /**
   * @constructor
   */
  stg.Fsm = function(options) {
    if (!(this instanceof stg.Fsm)) {
      throw new Error('This is a constructor, call it using new !');
    }
    this.name = options.name;
    this.stateMap = options.stateMap;
    this.stateKey = null;
    this.initialStateKey = options.initialStateKey;
    this.reset();
  };

  stg.Fsm.prototype.update = function() {
    if (this.state && this.state.update) {
      this.state.update();
    }
  };

  stg.Fsm.prototype.transition = function(stateKey) {
    if (this.state && this.state.onExit) {
      this.state.onExit();
    }
    this.stateKey = stateKey;
    this.state = this.stateMap[stateKey];
    if (!this.state) {
      throw new Error("Impossible transition to unknown stateKey '" + stateKey + "', " + this.toString());
    }
    if (this.state.onEnter) {
      this.state.onEnter();
    }
  };

  stg.Fsm.prototype.reset = function() {
    this.transition(this.initialStateKey);
  };

  stg.Fsm.prototype.toString = function() {
    return this.name + " in state: " + this.stateKey;
  };

}(window.stg = window.stg || {}));