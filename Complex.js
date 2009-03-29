// Complex.js
// (c) 2009 B. Crowell and M. Khafateh, GPL 2 license
//
// This file provides a constructor, com.lightandmatter.Complex.
//

var com;
if (!com) {com = {};}
if (!com.lightandmatter) {com.lightandmatter = {};}


com.lightandmatter.Complex =
  function (x,y) {
    var c = {};

    c.x = x;
    c.y = y;
    c.mytype = 'c';

    c.clone = function () {return com.lightandmatter.Complex(c.x,c.y); };
    c.eq = function (b) {return c.x!==null && c.y!==null && c.x==b.x && c.y==b.y; };
    c.add = function (b) {var z = c.clone(); z.x += b.x; z.y += b.y; return z; };
    c.sub = function (b) {var z = c.clone(); z.x -= b.x; z.y -= b.y; return z; };
    c.sq_abs = function () {return c.x*c.x+c.y*c.y;};
    c.abs = function () {return Math.sqrt(c.sq_abs());};
    c.arg = function () {return atan2(c.y,c.x);};
    c.mul = function (b) { return com.lightandmatter.Complex(c.x*b.x-c.y*b.y,c.x*b.y+c.y*b.x); };
    c.inv = function () { 
                           var s = c.sq_abs();
                           return com.lightandmatter.Complex(c.x/s,-c.y/s); };
    c.neg = function () {  return com.lightandmatter.Complex(-c.x,-c.y); };
    c.div = function (b) { return c.mul(b.inv()); };
    c.exp = function () {
      var e = Math.exp(c.x);
      return  com.lightandmatter.Complex(e*Math.cos(c.y),e*Math.sin(c.y));
    };
    c.arg = function () { return Math.atan2(c.y,c.x); };
    c.ln =  function () {
      return  com.lightandmatter.Complex(0.5*Math.log(c.sq_abs()),c.arg());
    };
    c.force_real = function () {c.y=0;}
    c.sq = function () {  return c.mul(c); };
    c.int_pow = function(p) { // c^p, p is an integer; for internal use only; check for 0^0 before calling this function
        // Do these first for efficiency in the case of largish exponents, calling recursively:
        if (p===0) {return com.lightandmatter.Complex(1.0,0.0);} // 0^0 not allowed as input
        if (p==1) {return c;}
        if (p==2) {return c.sq();}
        if (c.x===0 && c.y===0) {
          if (p>0) {return 0;}
          if (p<0) {return NaN;}
        }
        // From here on, we know that neither c nor p is zero.
        if (p<0) {return c.int_pow(-p).inv();}
        // If we get to here, p is >=3 and the base c is nonzero.
        var m = Math.floor(p/2.0);
        var n = p-2*m; // may be 0 or 1
        return c.int_pow(m).sq().mul(c.int_pow(n));
    };
    c.pow = function(b) { // c^b
      if (b.x===0 && b.y===0 && c.x===0 && c.y===0) {return NaN;}
      if (b.y===0 && b.x==Math.floor(b.x)) { // special-casing for small integer exponents, to avoid loss of precision on expressions like i^3
        var p = Math.floor(b.x);
        return c.int_pow(p);
      }
      return c.ln().mul(b).exp();
    };
    c.sqrt = function() {return c.pow(com.lightandmatter.Complex(0.5,0));};
    c.floor = function() {return com.lightandmatter.Complex(Math.floor(c.x),Math.floor(c.y));};
    c.ceil = function() {return com.lightandmatter.Complex(Math.ceil(c.x),Math.ceil(c.y));};

    c.toString = function() {
      if (c.y===0) {return c.x.toString();}
      if (c.x===0) {
        if (c.y==1) {return 'i';}
        if (c.y== -1) {return '-i';}
        return c.y.toString()+' i';
      }
      return c.x + ' + ' + c.y + ' i';
    };

    return c;

  };
