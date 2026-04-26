/**
 * CSInterface.js — minimal subset of Adobe's CEP bridge library.
 * Full version: https://github.com/Adobe-CEP/CEP-Resources
 *
 * evalScript(script, callback) — runs ExtendScript in the host app.
 * getSystemPath(type)          — returns a path string.
 * cep.fs.writeFile()           — available globally in CEP without this library.
 */

var SystemPath = {
  EXTENSION:       'extension',
  COMMON_FILES:    'commonFiles',
  MY_DOCUMENTS:    'myDocuments',
  APPLICATION:     'application',
  USER_DATA:       'userData',
  HOST_APPLICATION:'hostApplication',
};

var CSInterface = (function () {

  function CSInterface() {
    this._cep = window.__adobe_cep__;
  }

  // Evaluate ExtendScript in the host application.
  // callback(result: string) is called with the serialised return value.
  CSInterface.prototype.evalScript = function (script, callback) {
    if (typeof callback === 'function') {
      this._cep.evalScript(script, callback);
    } else {
      this._cep.evalScript(script);
    }
  };

  // Returns a file-system path for the given SystemPath constant.
  CSInterface.prototype.getSystemPath = function (pathType) {
    var raw = this._cep.getSystemPath(pathType);
    return decodeURIComponent(raw);
  };

  // Register a listener for events dispatched from the host or other panels.
  CSInterface.prototype.addEventListener = function (type, listener) {
    this._cep.addEventListener(type, function (event) { listener(event); });
  };

  return CSInterface;
}());
