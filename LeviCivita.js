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
  function (front,leading,series) { // series arg is optional
    var c = {};

    // form is front*d^leading*(sum a_q*d^q), where all q's are >0
    c.f = front; // can be real or complex
    c.l = leading;  // can be Rational or an integer represented in floating point
    if (arguments.length<3) {series = [[0,1]];}
    c.s = series; // array of pairs of the form [q,a_q]; q's can be Rational or integer, and a_q's can be real or complex; first pair must be [0,1]; must be sorted
                  // 0 is represented with front=0 and s=[[0,1]]
    c.mytype = 'l';
    c.rr = com.lightandmatter.Rational(1,1); // just need one handy to get access to class methods
    c.nn = com.lightandmatter.Num;           // ...similar

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
      return com.lightandmatter.LeviCivita(0.0,0);
    }
    c.toString = function() {
      var l = [];
      for (var i in c.s) {
        var q = c.s[i][0];
        var a = c.s[i][1];
        var power = c.nn.binop('+',q,c.l);
        var coeff = c.nn.binop('*',c.f,a);
        var s = coeff.toString();
        if (c.nn.num_type(coeff)!='r' && s.length>1) {
          s = '('+s+')';
        }
        var p0 = c.nn.binop('=',power,0);
        var p1 = c.nn.binop('=',power,1);
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
      z.f = c.nn.binop('-',0,z.f);
      return z;
    };
    c.add = function (b) {
      if (c.f===0) {return b;} // Otherwise we divide by zero below.
      var z = c.clone();
      var h = c.nn.binop('-',b.l,c.l);
      var ff = c.nn.binop('/',b.f,c.f);
      for (var i in b.s) {
        var q = c.nn.binop('+',b.s[i][0],h);
        //c.debug("multiplying "+b.s[i][1]+" * "+ff);
        var a = c.nn.binop('*',b.s[i][1],ff);
        //c.debug("...result = "+a);
        z.s.push([q,a]);
      }
      z.tidy();
      return z;
    };
    c.sub = function (b) {
      return c.add(b.neg()); // add() handles tidying
    };
    c.is_real = function () {
      if (com.lightandmatter.Num.num_type(c.f)=='c' && c.f.y!==0) {return false}
      for (var i=0; i<c.s.length; i++) {
        var a = c.s[i][1];
        if (com.lightandmatter.Num.num_type(a)=='c' && a.y!==0) {return false}
      }
      return true;
    };
    c.eq = function(b) {
      if (c.f != b.f) {return false;}
      if (c.l != b.l) {return false;}
      if (c.s.length != b.s.length) {return false;}
      for (var i in c.s) {
        if (!c.nn.binop('=',c.s[i][0],b.s[i][0])) {return false;}
        if (!c.nn.binop('=',c.s[i][1],b.s[i][1])) {return false;}
      }
      return true;
    };
    c.cmp = function (b) {
      if (!(c.is_real() && b.is_real())) {return null}
      if (c.f===0 && b.f===0) {return 0;}
      if ((c.f===0 && b.f!==0) || (c.f!==0 && b.f===0)) {return c.nn.binop('cmp',c.f,b.f);}
      // From this point on, we know they're both real, and both nonzero.
      var ll = c.nn.binop('cmp',c.l,b.l);
      if (ll!==0) {return -ll;}
      var ff = c.nn.binop('cmp',c.f,b.f);
      if (ff!==0) {return ff;}
      return c.nn.binop('cmp',c.nn.binop('-',c,b),0);
    };
    c.eps_part = function() { // return the part of the series that's infinitesimal compared to the leading term
      var e = c.clone();
      e.f = 1;
      e.l = 0;
      return c.nn.binop('-',1,e);
    };
    c.expand = function(t) { // expand a Taylor series; t is an array containing the coefficients
      var s = c.zero();
      var pow = com.lightandmatter.LeviCivita(1,0); // =c^i
      var m = t.length;
      for (var i=0; i<m; i++) {
        var term = c.nn.binop('*',t[i],pow);
        //c.debug('term '+i+'='+term+' ');
        s = c.nn.binop('+',s,term);
        //c.debug('s='+s+' ');
        if (i<m-1) {pow = c.nn.binop('*',pow,c);}
      }
      //c.debug('total='+s+' ');
      return s;
    };
    c.generate_taylor = function (f) {
      var m = com.lightandmatter.LeviCivita.n;
      var t = [];
      for (var i=0; i<m; i++) {
        t.push(f(i));
      }
      return t;
    };
    c.inv = function() {
      var z = c.clone();
      z.f = c.nn.binop('/',1,z.f);
      z.l = c.nn.binop('-',0,z.l);
      z.s = [[0,1]];
      // reduce it to inverting 1/(1-e):
      return c.nn.binop('*',z,c.eps_part().expand(c.generate_taylor(function(i){return 1;})));
    };
    c.div = function (b) {
      return c.nn.binop('*',c,b.inv());
    };
    c.mul = function (b) {
      var z = com.lightandmatter.LeviCivita(c.nn.binop('*',b.f,c.f),c.nn.binop('+',b.l,c.l));;
      z.s = [];
      for (var i in b.s) {
        for (var j in c.s) {
          var q = c.nn.binop('+',b.s[i][0],c.s[j][0]);
          var a = c.nn.binop('*',b.s[i][1],c.s[j][1]);
          z.s.push([q,a]);
        }
      }
      z.tidy();
      return z;
    };
    c.tidy = function() {
      c.s.sort(function(a,b) {return c.nn.binop('cmp',a[0],b[0])});
      var ss = [];
      var last_q = null;
      for (var i=0; i<c.s.length; i++) {
        if (c.nn.binop('cmp',c.s[i][0],last_q)===0) {
          ss[ss.length-1][1] = c.nn.binop('+',ss[ss.length-1][1],c.s[i][1]);
          //c.debug('a = '+ss[ss.length-1][1]);
        }
        else {
          ss.push(c.s[i]);
        }
        last_q = c.s[i][0];
      }
      c.s = ss;
      for (var i=0; i<c.s.length; i++) {
        if (c.nn.binop('cmp',c.s[i][1],0)===0) {
           c.s.splice(i,1);
        }
      }
      if (c.s.length===0) {c = c.zero()}
      c.s.splice(com.lightandmatter.LeviCivita.n); // truncate to n terms
      var k = c.s[0][1];
      c.f = c.nn.binop('*',c.f,k);
      //c.debug('new front = '+c.f);
      for (var i=0; i<c.s.length; i++) {
        c.s[i][1] = c.nn.binop('/',c.s[i][1],k);
        //c.debug('new a = '+c.s[i][1].tidy());
      }
    };

    c.debug = function(s) {
      document.getElementById("debug").innerHTML=document.getElementById("debug").innerHTML+' '+s+' ';
    };

    return c;

  };

com.lightandmatter.LeviCivita.n = 6; // number of terms to keep in the series
