// LeviCivita.js
// (c) 2009 B. Crowell, GPL 2 license
//
// This file provides a constructor, com.lightandmatter.LeviCivita.
//
// to do:
//   (1+i)*d doesn't work, because I'm multiplying a_q's using *; all operations on a's should accomodate complex numbers

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
                  // 0 is represented with front=0 and s=[[0,1]]
    c.mytype = 'l';
    c.n = 6; // number of terms to keep in the series
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
    c.zero = function () {
      return com.lightandmatter.LeviCivita(0.0,0,[[0,1]]);
    }
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
        if (s=='1' && !p0) {s='';}
        if (s=='-1' && !p0) {s='-';}
        if (!p0) {s = s + 'd';}
        if (!p0 && !p1) {s = s + '<sup>' + power + '</sup>';}
        l.push(s);
      }
      return l.join('+');
    };
    c.neg = function() {
      var z = c.clone();
      z.f = -z.f;
      return z;
    };
    c.add = function (b) {
      if (c.f===0) {return b;} // Otherwise we divide by zero below.
      var z = c.clone();
      for (var i in b.s) {
        var q = b.s[i][0]+b.l-c.l;
        var a = b.s[i][1]*b.f/c.f;
        z.s.push([q,a]);
      }
      z.tidy();
      return z;
    };
    c.sub = function (b) {
      return c.add(b.neg()); // add() handles tidying
    }
    c.mul = function (b) {
      var z = com.lightandmatter.LeviCivita(b.f*c.f,c.rr.add_r(b.l,c.l),[]);;
      for (var i in b.s) {
        for (var j in c.s) {
          var q = c.rr.add_r(b.s[i][0],c.s[j][0]);
          var a = c.rr.mul_r(b.s[i][1],c.s[j][1]);
          z.s.push([q,a]);
        }
      }
      z.tidy();
      return z;
    };
    c.tidy = function() {
      c.s.sort(function(a,b) {return c.rr.cmp_r(a[0],b[0])});
      var ss = [];
      var last_q = null;
      for (var i=0; i<c.s.length; i++) {
        if (c.rr.cmp_r(c.s[i][0],last_q)===0) {
          ss[ss.length-1][1] += c.s[i][1];
        }
        else {
          ss.push(c.s[i]);
        }
        last_q = c.s[i][0];
      }
      c.s = ss;
      for (var i=0; i<c.s.length; i++) {
        if (c.rr.cmp_r(c.s[i][1],0)===0) {
           c.s.splice(i,1);
        }
      }
      if (c.s.length===0) {c = c.zero()}
      c.s.splice(c.n); // truncate to c.n terms
      var k = c.s[0][1];
      c.f = c.f*k;
      for (var i=0; i<c.s.length; i++) {
        c.s[i][1] = c.s[i][1]/k;
      }
    };

    c.debug = function(s) {
      document.getElementById("debug").innerHTML=document.getElementById("debug").innerHTML+' '+s+' ';
    };

    return c;

  };
