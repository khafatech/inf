// Parser.js
// (c) 2009 B. Crowell, GPL 2 license
//
// This file provides a constructor, com.lightandmatter.Parser.
//
// Design:
//    two types of operators: infix binary, prefix unary
//    prefix unary (functions) have highest priority
//    unary minus is detected based on the token to its left, and is converted to 0-x
//    binary operators are left-associative by default
//    assignment operator returns lhs, and has side-effect of carrying out assignment
// to do:
//    implement trig and inverse trig functions for complex args

var com;
if (!com) {com = {};}
if (!com.lightandmatter) {com.lightandmatter = {};}


com.lightandmatter.Parser =
  function (args) {
    // in order from lowest to highest precedence:
    this.binop = [
      {'name':':'},
      {'name':'<'},
      {'name':'>'},
      {'name':'='},
      {'name':'+'},
      {'name':'-','unary':false},
      {'name':'*'},
      {'name':'/'},
      {'name':'-','unary':true}, // handles -3^2
      {'name':'^','assoc':'right'},
      {'name':'-','unary':true} // handles 3^-1
    ];
    this.unop = [
      {'name':'sin','func':Math.sin},
      {'name':'cos','func':Math.cos},
      {'name':'tan','func':Math.tan},
      {'name':'asin','func':Math.asin},
      {'name':'acos','func':Math.acos},
      {'name':'atan','func':Math.atan},
      {'name':'sqrt','func':Math.sqrt,'cfunc':'sqrt'},
      {'name':'abs','func':Math.abs,'cfunc':'abs'},
      {'name':'exp','func':Math.exp,'cfunc':'exp'},
      {'name':'ln','func':Math.log,'cfunc':'ln'},
      {'name':'floor','func':Math.floor,'cfunc':'floor'},
      {'name':'ceil','func':Math.ceil,'cfunc':'ceil'}
    ];

    this.sym = {
      'pi':Math.PI,
      'i':com.lightandmatter.Complex(0.0,1.0),
      'd':com.lightandmatter.LeviCivita(1.0,1.0,[[0,1]])
    };

    this.parse = function(tokens,props) {
      this.errs = [];
      this.tokens = tokens; // used only for error reporting
      this.props = props;
      this.tree = this.parse_part(tokens,0,tokens.length-1);
    };

    this.parse_part = function(tokens,start,end) {
      if (start>=end) {
        var p = this.props[start];
        if (p!==undefined) {
          if (p.name===null && p.num===null && tokens[start]!=='-' && tokens[start]!='') {this.errs.push(['illegal characters',start,end]);}//final test on - is to allow for unary minus
          if (p.num!==null) {
            // Lexer will let through malformed stuff like 1.2.3. Check for that.
            if (tokens[start].match(/\..*\./)) {this.errs.push(['malformed number with more than one decimal point',start,end]);}
          }
        }
        return ['leaf',tokens[start],p];
      }
      for (var i=0; i<this.binop.length; i++) {
        var b = this.binop[i];
        var name = b.name;
        var assoc = b.assoc;
        var j1 = end;
        var step = -1;
        if (assoc==='right') {
          j1 = start;
          step = 1;
        }
        var paren_depth = 0;
        for (var k=0; k<=(end-start); k++) {
          var j = j1+k*step;
          var tl = null; // token to left
          if (j!=start) {tl = tokens[j-1];}
          if (tokens[j]==name && paren_depth===0) {
            var is_unary_minus = name=='-' && ((j==start) || (/[=\+\-\*\/\^\(]/.test(tl))); // the kludgy regex is needed for, e.g., 2*-3
            var match = (name!='-') || (is_unary_minus==b.unary);
            var lhs = this.parse_part(tokens,start,j-1);
            var rhs = this.parse_part(tokens,j+1,end);
            if (match) {
              var skip = false;
              if (is_unary_minus) {
                if (j==start) { // 2*-3
                  lhs=['leaf','0',{'name':null,'num':0}];
                }
                else { // 3^-1
                  skip = true;
                }
              }
              if (! skip) {return ['binop',name,lhs,rhs,start,end,j];}
            }
          }
          if ((step==1 && tokens[j]=='(') || (step==-1 && tokens[j]==')')) {paren_depth++;}
          if ((step==1 && tokens[j]==')') || (step==-1 && tokens[j]=='(')) {paren_depth--;}
        }
        if (paren_depth !== 0) {this.errs.push(['unbalanced parentheses',start,end]); return null;}
      }// end of loop over binary operators
      if (tokens[start]=='(' && tokens[end]==')') {return this.parse_part(tokens,start+1,end-1);}
      for (var i=0; i<this.unop.length; i++) {
        var u = this.unop[i];
        var name = u.name;
        if (tokens[start]==name) {return ['unop',name,this.parse_part(tokens,start+1,end),start,end];}
      }
      this.errs.push(['syntax error',start,end]);
      return null;
    };

    this.to_debug_string = function() {
      return this.tokens.join(',')+' -- '+this.tree_to_debug_string(this.tree);
    };

    this.tree_to_debug_string = function(tree) {
      var what = tree[0];
      if (what==='leaf') {return 'l('+tree[1]+','+this.props_to_string(tree[2])+')';}
      if (what==='error') {return 'error in substring from token '+tree[1]+' to token '+tree[2];}
      if (what==='binop') {return 'b('+tree[1]+','+this.tree_to_debug_string(tree[2])+','+this.tree_to_debug_string(tree[3])+')';}
      if (what==='unop') {return 'u('+tree[1]+','+this.tree_to_debug_string(tree[2])+')';}
      return 'unrecognized:'+tree+'?';
    };

    this.toString = function() {
      var s = this.tree_to_string(this.tree); // evaluates it, and may also cause errors
      if (this.errs.length>0) {
        var e = '';
        for (var i in this.errs) {
          var ee = this.errs[i];
          var t = '';
          if (ee[1]!==undefined && ee[2]!==undefined) {t = ': "' +this.tokens.slice(ee[1],ee[2]+1).join(' ')+'"';}
          e = e + '<p>Error: ' + ee[0] + t +'</p>';
        }
        return e;
      }
      if (s===null) {s='';}
      s = s.toString().replace(/NaN/,"undefined");
      return s;
    };

    this.tree_to_string = function(tree) {
      var what = tree[0];
      if (what==='leaf') {
        var props = tree[2];
        if (props!==undefined && props.num!==null) {return props.num*1;}
        if (props!==undefined && props.name!==null) {
          var name = props.name;
          var value = this.sym[name];
          if (value===undefined) {this.errs.push(["undefined variable: \""+name+'"']); return null;}
          return value;
        }
        return null;
      }
      if (what==='error') {return null;}
      if (what==='binop') {
        var op = tree[1];
        var start = tree[4]; // for error messages, if necessary
        var end = tree[5];
        var b = this.tree_to_string(tree[3]); // right-hand side
        if (b===null) {this.errs.push(["Nothing is on the right-hand side of the operator "+op+" in the expression ",start,end]); return null;}
        if (op==':') {
          var lhs = tree[2];
          if (lhs[0] != 'leaf' || lhs[2].name===null) {
            this.errs.push(["The left-hand side of the assignment statement is not a valid name for a variable."],start,end);
            return null;
          }
          this.sym[lhs[2].name] = b;
          return b;
        }
        var a = this.tree_to_string(tree[2]); // left-hand side
        var prom = promote(a,b);
        var t = prom[0];
        a = prom[1];
        b = prom[2];
        if (t!='r' && t!='c' && t!='l') {
          this.errs.push(["illegal number type: "+t],start,end);
          return null;
        }
        if (op=='=') {
          if (t=='r') {return a==b;}
          if (t=='c') {return a.eq(b);}
        }
        if (op=='<') {
          if (t=='r') {return a<b;}
        }
        if (op=='>') {
          if (t=='r') {return a>b;}
        }
        if (op=='+') {
          if (t=='r') {return a+b;}
          if (t=='c' || t=='l') {return a.add(b);}
        }
        if (op=='-') {
          if (t=='r') {return a-b;}
          if (t=='c' || t=='l') {return a.sub(b);}
        }
        if (op=='*') {
          if (t=='r') {return a*b;}
          if (t=='c' || t=='l') {return a.mul(b);}
        }
        if (op=='/') {
          if (t=='r') {
            if (b===0.0) {return NaN;}
            return a/b;
          }
          if (t=='c') {return a.div(b);}
        }
        if (op=='^') {
          if (t=='r') {
            if (a===0 && b===0) {return NaN;}
            if (a===0 && b<0) {return NaN;}
            return Math.pow(a,b);
          }
          if (t=='c') {return a.pow(b);}
        }
        this.errs.push(["The binary operator "+op+" is not implemented for variables of type "+describe_type(t),start,end]);
        return null;
      }
      if (what==='unop') {
        var f = tree[1];
        var start = tree[3]; // for error messages, if necessary
        var end = tree[4];
        var x = this.tree_to_string(tree[2]);
        var t = num_type(x);
        if (x===null) {return null;}
        for (var i in this.unop) {
          if (this.unop[i].name==f) {
            var ff;
            if (t=='r' && f=='ln' && x<0.0) {t='c'; x=com.lightandmatter.Complex(x,0.0); }
            if (t=='r') {
              ff = this.unop[i].func;
            }
            else {
              ff = x[this.unop[i].cfunc];
            }
            if (ff===undefined) {this.errs.push(["The function "+f+" is not implemented for variables of type "+describe_type(t),start,end]); return null;}
            return ff(x);
          }
        }
      }
      return null;
    };

    this.props_to_string = function(props) {
      if (props===undefined) {return null;}
      return 'name='+props.name+', num='+props.num;
    };

    var describe_type = function(t) {
      if (t=='r') {return 'real';}
      if (t=='c') {return 'complex';}
      if (t=='l') {return 'Levi-Civita';}
      return t;
    };

    var promote = function(x,y) {
      var tx = num_type(x);
      var ty = num_type(y);
      if (tx==ty) {return [tx,x,y];}
      if (tx=='r' && ty=='c') {return ['c',com.lightandmatter.Complex(x,0),y];}
      if (tx=='c' && ty=='r') {return ['c',x,com.lightandmatter.Complex(y,0)];}
      if (tx=='l' && (ty=='r' || ty=='c')) { return ['l',x,com.lightandmatter.LeviCivita(y,0,[[0,1]])];}
      if (ty=='l' && (tx=='r' || tx=='c')) { return ['l',com.lightandmatter.LeviCivita(x,0,[[0,1]]),y];}
      if (ty=='l' && (tx=='r' || tx=='c')) { return promote(y,x);}
      return [null,null,null,["unable to do type promotion, types="+tx+','+ty]];
    };

    var num_type = function(x) {
      if (x===null) {return null;}
      if (typeof(x)=='number') {return 'r';} // real
      if (x.mytype == 'c') {return 'c';} // complex
      if (x.mytype == 'l') {return 'l';} // Levi-Civita
      return null;
    };

    var debug = function(s) {
      document.getElementById("debug").innerHTML=document.getElementById("debug").innerHTML+' '+s+' ';
    };

  };
