/* Browser-based parser tests, execute with an actual DOMParser (Safari/Chromium).
 * Node smoke tests exercise exported API and rejection when parser is unavailable. */
const assert=require("node:assert/strict");
const P=require("./ite-fatturapa-166.js");
assert.equal(typeof P.parse,"function");
assert.throws(()=>P.parse('<!DOCTYPE x><x/>'),/XML_NON_AMMESSO/);
assert.throws(()=>P.parse("x".repeat(2000001)),/XML_NON_AMMESSO/);
if(typeof DOMParser==="undefined")assert.throws(()=>P.parse("<x/>"),/PARSER_XML_NON_DISPONIBILE/);
console.log("FatturaPA 166 Node smoke OK; XML parsing requires browser DOMParser.");
