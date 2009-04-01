// Parser.js
// (c) 2009 B. Crowell and M. Khafateh, GPL 2 license
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
//    implement inverse trig functions for complex and LC args
//    make some operators for operating on an LC number z:
//      lc_lambda z = lambda "order of magnitude" operator
//      array z = list of lists of q's and a_q's.
//      These would be useful in the test suite.
//    Array thing is awkward right now because I don't have any easy way to form nested lists syntactically;
//               can do (1,(2,3)), but because it's left-associative, ((1,2),(3,4)) evaluates to [1,2,[3,4]].
//               This makes it impossible to use arrays to check LC numbers in test suite, which was the main application of arrays I had in mind.
//               Possible solution is to have a flatten operator. I'm not clear on how to implement something like JS's [[1,2],[3,4]] in my parser,
//               and I'm not sure I want to dedicate square brackets to this purpose. I can stick dummy elements on the front, like (0,(1,2)), but that's lame.

var com;
if (!com) {com = {};}
if (!com.lightandmatter) {com.lightandmatter = {};}

com.lightandmatter.Parser =
  function () {
    this.nn = com.lightandmatter.Num;
    // in order from lowest to highest precedence:
    this.binop = [
      {'name':';','nopromote':true},
      {'name':':','nopromote':true},
      {'name':',','nopromote':true},
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
    // In the following, func points to the function to use on the native javascript number type, cfunc is the one to use for everything else.
    // Some functions are implemented only in LeviCivita, not in Complex, so we promote and use the LC function; these are marked with c_as_l.
    // Similarly if it's not implemented in Math for native numbers, set func to null.
    this.unop = [
      {'name':'sin','func':Math.sin,'cfunc':'sin','c_as_l':true},
      {'name':'cos','func':Math.cos,'cfunc':'cos','c_as_l':true},
      {'name':'tan','func':Math.tan,'cfunc':'tan','c_as_l':true},
      {'name':'asin','func':Math.asin},
      {'name':'acos','func':Math.acos},
      {'name':'atan','func':Math.atan},
      {'name':'sinh','func':null,'cfunc':'sinh','c_as_l':true},
      {'name':'cosh','func':null,'cfunc':'cosh','c_as_l':true},
      {'name':'tanh','func':null,'cfunc':'tanh','c_as_l':true},
      {'name':'sqrt','func':Math.sqrt,'cfunc':'sqrt'},
      {'name':'abs','func':Math.abs,'cfunc':'abs'},
      {'name':'exp','func':Math.exp,'cfunc':'exp'},
      {'name':'ln','func':Math.log,'cfunc':'ln'},
      {'name':'floor','func':Math.floor,'cfunc':'floor'},
      {'name':'ceil','func':Math.ceil,'cfunc':'ceil'},
      {'name':'array','cfunc':'to_array'}
    ];

    this.sym = {
      'pi':Math.PI,
      'i':com.lightandmatter.Complex(0.0,1.0),
      'd':com.lightandmatter.LeviCivita(1.0,1.0,[[0,1]]),
    };
    // get and set the variable by calling this function rather that by looking something up in the symbol table:
    this.sym_side_effect = {
      'levi_civita_n':com.lightandmatter.LeviCivita.change_n
    };
    this.builtin_constants = {}; // They're not allowed to overwrite these.
    for (var builtin in this.sym) {
      this.builtin_constants[builtin] = true;
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
          if (p.name===null && p.num===null && tokens[start]!=='-' && tokens[start]!=='') {this.errs.push(['illegal characters',start,end]);}//final test on - is to allow for unary minus
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
            var function_def = ''; // ='f' for function definition f x : x^2
            var bound_var = '';
            var clobbered; // normally stays undefined; if defining f x, x may also be a defined variable, so save its value
            if (name==':' && j==start+2) {
              function_def=tokens[start];
              bound_var=tokens[start+1];
              this.delete_function(function_def);
              this.unop.unshift({'name':function_def});
              clobbered = this.sym.bound_var;
              this.sym.bound_var = null; // null marks it as bound var
            } 
            var lhs = this.parse_part(tokens,start,j-1);
            var rhs = this.parse_part(tokens,j+1,end);
            if (function_def!=='') {
              if (clobbered!==undefined) {this.sym.bound_var=clobbered;}
              lhs = ['leaf',function_def,{'name':function_def}];
              rhs = this.lambdafy(bound_var,rhs);
            }
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
          if ((step==1 && this.is_left_paren(tokens[j]))  || (step==-1 && this.is_right_paren(tokens[j]))) {paren_depth++;}
          if ((step==1 && this.is_right_paren(tokens[j])) || (step==-1 && this.is_left_paren(tokens[j])) ) {paren_depth--;}
        }
        if (paren_depth !== 0) {this.errs.push(['unbalanced parentheses',start,end]); return null;}
      }// end of loop over binary operators
      if (this.is_left_paren(tokens[start]) && this.is_right_paren(tokens[end])) {
        if (this.paren_style(tokens[start])!=this.paren_style(tokens[end])) {this.errs.push(['mismatched style of parentheses'],start,end);}
        var inside = this.parse_part(tokens,start+1,end-1);
        if (inside[0]=='binop' && inside[1]==',') {if (inside[7]===undefined) {inside[7]={};} inside[7].closed_array=true;}
        return inside;
      }
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
      if (typeof(s)=='object' && s instanceof Array) {
        // Intervene to keep it from flattening arrays of arrays, which is what toString() normally does on arrays.
        s = this.array_to_string(s);
      }
      s = s.toString().replace(/NaN/,"undefined");
      return s;
    };

    this.array_to_string = function(a) {
      if (typeof(a)=='object' && a instanceof Array) {
        var b = [];
        for (var i in a) {
          b.push(this.array_to_string(a[i]));
        }
        return '['+b.join(',')+']';
      }
      else {
        return a.toString();
      }
    };

    this.tree_to_string = function(tree) { // badly named, doesn't really compute string
      var what = tree[0];
      if (what==='leaf') {
        var props = tree[2];
        if (props!==undefined && props.num!==null) {return props.num*1;}
        if (props!==undefined && props.name!==null) {
          var name = props.name;
          var value = this.sym[name];
          if (this.sym_side_effect[name]!==undefined) {value=this.sym_side_effect[name]();}
          if (value===undefined) {this.errs.push(["undefined variable: \""+name+'"']); return null;}
          return value;
        }
        return null;
      }
      if (what==='error') {return null;}
      if (what==='binop') {
        var op = tree[1];
        var lhs = tree[2];
        var rhs = tree[3];
        var start = tree[4]; // for error messages, if necessary
        var end = tree[5];
        var ca = false;
        if (lhs[7]!==undefined && lhs[7].closed_array===true) {ca=true;}
        var function_def = op==':' && rhs[0]=='lambda';
        var a;
        var b;
        if (!function_def) {
          // Order of evaluation can be important:
          //   In an assignment, don't even try to evaluate the left-hand side; even if we tried to evaluate it after the rhs, it would cause errors if
          //             if was a function definition, because the dummy var is undefined.
          //   In a ; operator, we need to evaluate the lhs first, because it may have side-effects such as assignment.
          if (op!=':') {a = this.tree_to_string(lhs);} 
          b = this.tree_to_string(rhs);
          if (b===null) {this.errs.push(["Nothing is on the right-hand side of the operator "+op+" in the expression ",start,end]); return null;}
        }
        if (op==':') {
          if (lhs[0] != 'leaf' || lhs[2].name===null) {
            this.errs.push(["The left-hand side of the assignment statement is not a valid name for a variable or function."],start,end);
            return null;
          }
          var n = lhs[2].name;
          if (this.builtin_constants[n]===true) {
            this.errs.push(["Illegal assignment into built-in constant "+n,start,end]);
            return null;
          }
          if (!function_def) {
            if (this.sym_side_effect[n]!==undefined) {this.sym_side_effect[n](b);}
            this.sym[n] = b;
            return b;
          }
          else {
            this.delete_function(n); // delete the placeholder that only had a name field but no userfunc
            this.unop.unshift({'name':n,'userfunc':rhs}); // ...and replace it with a full entry
            return null;
          }
        }// endif :
        // If it's not : operator, we fall through to here.
        return this.nn.binop(op,a,b,{'nopromote':this.find_binop(op).nopromote,'closed_array':ca});
      }
      if (what==='unop') {
        var f = tree[1];
        var start = tree[3]; // for error messages, if necessary
        var end = tree[4];
        var x = this.tree_to_string(tree[2]);
        var t = this.nn.num_type(x);
        if (x===null) {return null;}
        for (var i in this.unop) {
          if (this.unop[i].name==f) {
            var ff;
            if (this.unop[i].userfunc!==undefined) {
              ff = this.unop[i].userfunc;
              var b = ff[1]; // bound var, will be set to x; has a collision-avoiding name like 'bound_var___'
              var e = ff[2]; // defining expression
              var clobber = this.sym[b]; // may already have a value, if functions are nested
              this.sym[b] = x;
              var y = this.tree_to_string(e);
              delete this.sym.b;
              if (clobber!==undefined) {this.sym[b]=clobber}
              return y;
            }
            // Some functions are implemented only in LeviCivita, so promote and use the LC function:
            var as_lc = ((this.unop[i].c_as_l===true && t=='c') || (t=='r' && this.unop[i].func===null));
            if (as_lc) {x = com.lightandmatter.LeviCivita(x,0,[[0,1]]); t='l';}
            if (t=='r' && (isNaN(x) || !isFinite(x))) {return NaN;}
            if (t=='r') {
              ff = this.unop[i].func;
            }
            else {
              ff = x[this.unop[i].cfunc];
            }
            var dt =  this.nn.describe_type(t);
            if (ff===undefined) {this.errs.push(["The function "+f+" is not implemented for variables of type "+dt,start,end]); return null;}
            var y;
            try {
              y = ff(x);
            }
            catch (foo) {}
            if (y!==undefined && y!==null && !(typeof(y)=='number' && (isNaN(y) || !isFinite(y)))) {
              return y;
            }
            else {
              if (t=='r') {  // happens, e.g., ln(-1) or sqrt(-1) or asin(3)
                x = com.lightandmatter.Complex(x,0.0);
                ff = x[this.unop[i].cfunc];
                try {return ff(x);} catch(foo) {this.errs.push(["Error evaluating function "+f+" for type "+dt],start,end);}
              }
              else {
                return NaN;
              }
            } 
          }
        }
      }
      return null;
    };

    this.is_left_paren  = function (c) { return c=='(' || c=='[' || c=='{';   };
    this.is_right_paren = function (c) { return c==')' || c==']' || c=='}';   };
    this.paren_style = function(c) {
      if (c=='(' || c==')') {return 1;}
      if (c=='[' || c==']') {return 2;}
      if (c=='{' || c=='}') {return 3;}
      return null;
    };

    this.find_binop = function (op) {
      for (var i in this.binop) {
        if (this.binop[i].name==op) {return this.binop[i];}
      }
      return undefined;
    }

    this.props_to_string = function(props) {
      if (props===undefined) {return null;}
      return 'name='+props.name+', num='+props.num;
    };

    this.delete_function = function(f) {
      for (var i in this.unop) {
        if (this.unop[i].name==f) {this.unop.splice(i,i); return}
      }
    };

    this.lambdafy = function(x,tree) {
      var b = 'bound_var___';
      return ['lambda',b,this.rename_var(tree,x,b)];
    };

    this.rename_var = function(tree,x,y) {
      var what = tree[0];
      if (what==='leaf') {
        if (tree[1]!=x) {return tree}
        return [tree[0],y,{'name':y,'num':null}];
      }
      if (what==='error') {return tree;}
      if (what==='binop') {return [tree[0],tree[1],this.rename_var(tree[2],x,y),this.rename_var(tree[3],x,y)];}
      if (what==='unop') {return [tree[0],tree[1],this.rename_var(tree[2],x,y)];}
      return undefined;
    };

    var debug = function(s) {
      document.getElementById("debug").innerHTML=document.getElementById("debug").innerHTML+' '+s+' ';
    };

  };
