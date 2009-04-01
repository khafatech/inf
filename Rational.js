// Rational.js
// (c) 2009 B. Crowell and M. Khafateh, GPL 2 license
//
// This file provides a constructor, com.lightandmatter.Rational.
//

var com;
if (!com) {com = {};}
if (!com.lightandmatter) {com.lightandmatter = {};}


com.lightandmatter.Rational =
  function (x,y,notidy) {
    var c = {};

    c.x = x; // top; can be negative
    c.y = y; // bottom; supposed to be positive, but we'll fix it if it isn't
    // At the very end, after all the methods are defined, we tidy this.
    c.mytype = 'q';

    c.clone = function (notidy) {return com.lightandmatter.Rational(c.x,c.y,notidy); };
    c.to_array = function () {return [c.x,c.y];};
    c.eq = function (b) {return c.x!==null && c.y!==null && c.x*b.y==c.y*b.x; };
    c.cmp = function (b) {
      if (c.x===null || c.y===null) {return null;}
      return c.x*b.y-b.x*c.y; // works because y's are guaranteed positive
    };
    c.mul = function (b) { return com.lightandmatter.Rational(c.x*b.x,c.y*b.y); };
    c.div = function (b) { if (b.x===0) {return NaN;} return com.lightandmatter.Rational(c.x*b.y,c.y*b.x); };
    c.neg = function () { return com.lightandmatter.Rational(-c.x,c.y); };
    c.abs = function () { return com.lightandmatter.Rational(Math.abs(c.x),c.y); };
    c.add = function (b) { return com.lightandmatter.Rational(c.x*b.y+b.x*c.y,c.y*b.y); };
    c.sub = function (b) { return c.add(b.neg()); };

    c.toString = function() {
      if (c.y==1) {return c.x.toString();}
      return c.x + '/' + c.y;
    };
    c.toNumber = function() {
      return c.x/c.y;
    };
    c.tidy = function() { // returns result, doesn't operate in place; may return native number type
      if (c.y==1) {return c.x;}
      if (c.x===0) {return 0;}
      var j = c.clone(true);
      j.x = c.x;
      j.y = c.y;
      if (j.y<0) {j.x= -j.x; j.y= -j.y;}
      // mod operator messes up on negatives, so temporarily force positive:
      var s = 1;
      if (j.x<0) {
        s= -1;
        j.x= -j.x;
      } 
      var n = j.x;
      var d = j.y;
      var gcd = function(a,b) {
        if (b>a) {var foo=a; a=b; b=foo;}
        while (a%b>0) {var foo=b; b=a%b; a=foo;}
        return b;
      };
      var g = gcd(n,d);
      j.x = s*n/g;
      j.y = d/g;
      return j;
    };

    if (!notidy) {c=c.tidy();}

    return c;

  };
