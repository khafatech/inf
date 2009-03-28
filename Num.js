// Num.js
// (c) 2007 B. Crowell, GPL 2 license
//
// This file provides a module, com.lightandmatter.Num.
//

var com;
if (!com) {com = {};}
if (!com.lightandmatter) {com.lightandmatter = {};}


com.lightandmatter.Num = {};

com.lightandmatter.Num.describe_type = function(t) {
      if (t=='q') {return 'rational';}
      if (t=='r') {return 'real';}
      if (t=='c') {return 'complex';}
      if (t=='l') {return 'Levi-Civita';}
      return t;
    };

com.lightandmatter.Num.promote = function(x,y) {
      var nn = com.lightandmatter.Num;
      var tx = nn.num_type(x);
      var ty = nn.num_type(y);
      if (tx==ty) {return [tx,x,y];}
      if (nn.height(tx)<nn.height(ty)) {
        var v = nn.promote(y,x);
        var z = v[1];
        v[1] = v[2];
        v[2] = z;
        return v;
      }
      // From here on, we're guaranteed that x is the higher type, y needs promotion.
      var tt = tx+ty;

      // ---complex and (real|rational) ---
      if (tt=='cr' || tt=='cq') {
        if (ty=='q') {y=y.toNumber();}
        return ['c',x,com.lightandmatter.Complex(y,0)];
      }
      // real & rational --- test for whether r is integer
      // ---real and rational---
      if (tt=='rq') {
        if (x==Math.floor(x)) {
          // In the following, we have to defeat simplification into real.
          var u = com.lightandmatter.Rational(1,42); // 1/42 is something that won't get returned as a real by the constructor.
          u.x = x; u.y=1; 
          return ['q',u,y];
        } // demote real to rational, because it's actually an integer
        return ['r',x,y.toNumber()];
      }
      // ---LC and (real | complex | rational) ---
      if (tt=='lr' || tt=='lc' || tt=='lq') {
        if (ty=='q') {y=y.toNumber();}
        return ['l',x,com.lightandmatter.LeviCivita(y,0,[[0,1]])];
      }
      return [null,null,null,["unable to do type promotion, types="+tx+','+ty]];
    };

com.lightandmatter.Num.binop = function(op,a,b) {
        var nn = com.lightandmatter.Num;
        var original_b = b;
        var prom = nn.promote(a,b);
        var t = prom[0];
        a = prom[1];
        b = prom[2];
        if (t!='r' && t!='c' && t!='l' && t!='q') {
          return null;
        }
        if (op=='cmp') {
          if (t=='r') {return a-b;} else {return a.cmp(b);}
        }
        if (op=='=') {
          if (t=='r') {return a==b;} else {return a.eq(b);} // Complexes have = but not cmp.
        }
        if (op=='<') {
          if (t=='r') {return a<b;} else {return a.cmp(b)<0;}
        }
        if (op=='>') {
          if (t=='r') {return a>b;} else {return a.cmp(b)>0;}
        }
        if (op=='+') {
          if (t=='r') {return a+b;} else {return a.add(b);}
        }
        if (op=='-') {
          if (t=='r') {return a-b;} else {return a.sub(b);}
        }
        if (op=='*') {
          if (t=='r') {return a*b;} else {return a.mul(b);}
        }
        if (op=='/') {
          if (t=='r') {
            if (b===0.0) {return NaN;}
            if (a===Math.floor(a) && b===Math.floor(b)) {return com.lightandmatter.Rational(a,b);}
            return a/b;
          }
          else {
            return a.div(b);
          }
        }
        if (op=='^') {
          if (t=='l') {b = original_b;}
          if (t=='r') {
            if (a===0 && b===0) {return NaN;}
            if (a===0 && b<0) {return NaN;}
            return Math.pow(a,b);
          }
          else {
            return a.pow(b);
          }
        }
        return null;
     };

com.lightandmatter.Num.num_type = function(x) {
      if (x===null) {return null;}
      if (typeof(x)=='number') {return 'r';} // real
      if (x.mytype == 'q') {return 'q';} // rational
      if (x.mytype == 'c') {return 'c';} // complex
      if (x.mytype == 'l') {return 'l';} // Levi-Civita
      return null;
    };

// typically we promote to the "higher" type:
com.lightandmatter.Num.height = function (t) {
      return {'q':1,'r':2,'c':3,'l':4}[t];
    };

com.lightandmatter.Num.debug = function(s) {
      document.getElementById("debug").innerHTML=document.getElementById("debug").innerHTML+' '+s+' ';
    };
