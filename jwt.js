/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is trusted.js; substantial portions derived
 * from XAuth code originally produced by Meebo, Inc., and provided
 * under the Apache License, Version 2.0; see http://github.com/xauth/xauth
 *
 * Contributor(s):
 *     Ben Adida <benadida@mozilla.com>
 *     Michael Hanson <mhanson@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var libs = require("./libs/all"),
    utils = require("./jwtutils");

// algorithms
var rs = require("./algs/rs");

function NoSuchAlgorithmException(message) {
  this.message = message;
  this.toString = function() { return "No such algorithm: "+this.message; };
}
function NotImplementedException(message) {
  this.message = message;
  this.toString = function() { return "Not implemented: "+this.message; };
}
function MalformedWebTokenException(message) {
  this.message = message;
  this.toString = function() { return "Malformed JSON web token: "+this.message; };
}
function InputException(message) {
  this.message = message;
  this.toString = function() { return "Malformed input: "+this.message; };
}

//
// signature functionality, specific to JWT
//

var algs = {
  "RS" : rs
};

function NotImplementedException(message) {
  this.message = message;
  this.toString = function() { return "Not implemented: "+this.message; };
}

function getByAlg(alg) {
  if (!alg)
    throw new NotImplementedException("no alg provided");
  
  var module = algs[alg];
  if (!module)
    throw new NotImplementedException(alg);

  return module;
}

exports.getByAlg = getByAlg;

//
// JWT tokens
//

function WebToken(algorithm, assertion) {
  // algorithm is something like "RS256"
  // assertion is a structured clone of the fields that are asserted
  // FIXME: validate that assertion is one-layer deep only
  this.algorithm = algorithm;
  this.assertion = assertion;
};

WebToken.parse = function _parse(input) {
  var parts = input.split(".");
  if (parts.length != 3) {
    throw new MalformedWebTokenException("Must have three parts");
  }
  var token = new WebToken();
  token.headerSegment = parts[0];
  token.payloadSegment = parts[1];
  token.cryptoSegment = parts[2];  
  return token;
};

WebToken.prototype = {
  sign: function _sign(key) {
    var header = {"alg": this.algorithm};
    var algBytes = utils.base64urlencode(JSON.stringify(header));
    var jsonBytes = utils.base64urlencode(JSON.stringify(this.assertion));
    
    var stringToSign = algBytes + "." + jsonBytes;

    // sign
    // var algorithm = constructAlgorithm(this.algorithm, key);
    // algorithm.update(stringToSign);
    // var digestValue = algorithm.finalize();
    // var signatureValue = algorithm.sign();
    var signatureValue = key.sign(stringToSign);

    return algBytes + "." + jsonBytes + "." + signatureValue;
  },
  
  verify: function _verify(key) {
    // we verify based on the actual string
    // FIXME: we should validate that the header contains only proper fields
    var header = JSON.parse(utils.base64urldecode(this.headerSegment));

    // this.algorithm = header.alg;
    // var algorithm = constructAlgorithm(this.algorithm, key);
    // algorithm.update(this.headerSegment + "." + this.payloadSegment);
    // algorithm.finalize();
    
    return key.verify(this.headerSegment + "." + this.payloadSegment, this.cryptoSegment);
  }
};
  
exports.WebToken = WebToken;
exports.base64urlencode = utils.base64urlencode;
exports.base64urldecode = utils.base64urldecode;