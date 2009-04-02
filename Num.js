// Num.js
// (c) 2007 B. Crowell and M. Khafateh, GPL 2 license
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

com.lightandmatter.Num.binop = function(op,a,b,options) { // options arg is optional
        var nn = com.lightandmatter.Num;
        var nopromote = false;
        var closed_array = false;
        if (arguments.length>=4) {
          if (options.nopromote===true) {nopromote=true;}
          if (options.closed_array===true) {closed_array=true;}
        }
        var original_b = b;
        var prom,t;
        if (nn.num_type(a)=='a' || nn.num_type(b)=='a') {t='a';} // could be, e.g., 1,2,3, which gets evaluated as (1,2),3
        if (!nopromote && t!='a') {
          prom = nn.promote(a,b);
          t = prom[0];
          a = prom[1];
          b = prom[2];
        }
        if (op==';') {
          return b;
        }
        if (a===null || b===null) {return null;}
        if (op==',') {
          if (nn.num_type(a)=='a' && !closed_array) {
            a.push(b); // This has the side-effect of altering the lhs, but I think that's okay, because we won't retain any refs to it.
            return a;
          }
          else {
            return [a,b];
          }
        }
        if (op=='=') { // Complexes have = but not cmp; arrays have =.
          if (t=='r') {return a==b;}
          if (t=='a') {
            if (a.length!=b.length) {return false;}
            for (var i in a) {
              if (!nn.binop('=',a[i],b[i])) {return false;}
            }
            return true;
          }
          return a.eq(b);
        }
        if (t!='r' && t!='c' && t!='l' && t!='q') { // e.g., if it's an array, we return null
          return null;
        }
        if (op=='cmp') {
          if (t=='r') {return a-b;} else {return a.cmp(b);}
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
      if (typeof(x)=='object' && (x instanceof Array)) {return 'a';} // array
      if (typeof(x)=='number') {return 'r';} // real
      if (x.mytype == 'q') {return 'q';} // rational
      if (x.mytype == 'c') {return 'c';} // complex
      if (x.mytype == 'l') {return 'l';} // Levi-Civita
      return null;
    };

com.lightandmatter.Num.is_zero = function(c) {
      var t = com.lightandmatter.Num.num_type(c);
      if (t=='r') {return c===0;}
      if (t=='c') {return c.x===0 && c.y===0;}
      if (t=='q') {return c.x===0;}
      if (t=='l') {return c.f===0;}
    };

com.lightandmatter.Num.is_real = function(c) {
      //return true;
      var t = com.lightandmatter.Num.num_type(c);
      if (t=='r') {return true;}
      if (t=='c') {return c.y===0;}
      if (t=='q') {return true;}
      if (t=='l') {return c.is_real();}
    };

// typically we promote to the "higher" type:
com.lightandmatter.Num.height = function (t) {
      return {'q':1,'r':2,'c':3,'l':4}[t];
    };

com.lightandmatter.Num.debug = function(s) {
      document.getElementById("debug").innerHTML=document.getElementById("debug").innerHTML+' '+s+' ';
    };
