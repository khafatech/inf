// LeviCivita.js
// (c) 2009 B. Crowell, GPL 2 license
//
// This file provides a constructor, com.lightandmatter.LeviCivita.
//

var com;
if (!com) {com = {};}
if (!com.lightandmatter) {com.lightandmatter = {};}


com.lightandmatter.LeviCivita =
  function (front,leading,series) {
    var c = {};

    // form is front*d^leading*(sum a_q*d^q), where all q's are >0
    c.f = front; // can be real or complex
    c.l = leading;  // can be Rational or an integer represented in floating point
    c.s = series; // array of pairs of the form [q,a_q]; q's can be Rational or integer, and a_q's can be real or complex; first pair must be [0,1]; must be sorted
    c.mytype = 'l';
    c.rr = com.lightandmatter.Rational(1,1); // just need one handy to get access to class methods

    c.clone = function () {
      var x = com.lightandmatter.LeviCivita(c.f,c.l,[]);
      for (var i in c.s) {
        var q = c.s[i][0];
        var a = c.s[i][1];
        x.s.push([q,a]);
      }
      return x;
    };
    c.toString = function() {
      var l = [];
      for (var i in c.s) {
        var q = c.s[i][0];
        var a = c.s[i][1];
        var power = c.rr.add_r(q,c.l);
        var s = '';
        s = s + (c.f*a);
        var p0 = c.rr.eq_r(power,0);
        var p1 = c.rr.eq_r(power,1);
        if (!p0) {s = s + 'd';}
        if (!p0 && !p1) {s = s + '<sup>' + power + '</sup>';}
        l.push(s);
      }
      return l.join('+');
    };
    c.add = function (b) {
      // special-case c==0...
      var z = c.clone();
      for (var i in b.s) {
        var q = b.s[i][0]+b.l-c.l;
        var a = b.s[i][1]*b.f/c.f;
        z.s.push([q,a]);
      }
      z.tidy();
      return z;
    };
    c.tidy = function() {
      c.s.sort(function(a,b) {return c.rr.cmp_r(a[0],b[0])});
      // In the following, all the operations on the q's need to be polymorphicalizified. Also, I don't think the delete thing is quite right.
      for (var i=0; i<=c.s.length-2; i++) {
        if (c.s[i][0]==c.s[i+1][0]) {
          c.s[i][1] += c.s[i+1][1];
          delete c.s[i+1];
        }
      }
    }

    return c;

  };
