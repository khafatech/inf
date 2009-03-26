// Lexer.js
// (c) 2007 B. Crowell, GPL 2 license
//
// This file provides a constructor, com.lightandmatter.Lexer, for a fast lexer meant to be used
// with on-the-fly input from a user as he types.
//

var com;
if (!com) {com = {};}
if (!com.lightandmatter) {com.lightandmatter = {};}


com.lightandmatter.Lexer =
  function (args) {
    this.tokens = [];
    this.props  = []; // properties of the tokens

    var alpha    = "[^\\u0020-\\u0040\\u005b-\\u0060\\u007b-\\u007e]"; // anything that's not whitespace, ascii punctuation or digit
    var word     = "[^\\u0020-\\u0026\\u0028-\\u002f\\u003a-\\u0040\\u005b-\\u005e\\u0060\\u007b-\\u007e]"; //  alphabetic|0-9|_|'
    var name     = "(?:"+alpha+"(?:"+word+")*)";
    var alpha_regex  = new RegExp("^"+alpha+"$");
    var word_regex   = new RegExp("^"+word+"$");
    var name_regex   = new RegExp("^"+name+"$");
    //var num          = "(?:(?:\.[0-9]+)|(?:[0-9]+(?:\.[0-9]*)?))"; // This didn't quite work, regexes not greedy enough? Splits 12.3 into 12 and .3
    var num          = "(?:[0-9\\.]+)"; // matches malformed stuff like 1.2.3, but we can catch that later
    var num_regex    = new RegExp("^"+num+"$");

    this.change_text = function (t) {
      this.tokens = t.match(  new RegExp("("+name+"|[^0-9. ]|"+num+")",'g')  );
      if (this.tokens !== null) {
        for (var i=0; i<this.tokens.length; i++) {
          this.props[i] = {
            'name':this.tokens[i].match(name_regex), // boolean, is it a name?
            'num': this.tokens[i].match(num_regex) // boolean, is it a number?
          };
        }
      }
    };

    this.toString = function() {
      if (this.tokens !== null) {
        return this.tokens.join(',');
      }
      else {
        return '';
      }
    };
  };
