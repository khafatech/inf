// Test.js
// (c) 2007 B. Crowell and M. Khafateh, GPL 2 license
//
// This file provides a constructor, com.lightandmatter.Test.
//
// to do:
//   fix the ones that actually fail
//   After implementing lc_series operator, use it in tests to make sure specific coefficients of series expansions come out right.

var com;
if (!com) {com = {};}
if (!com.lightandmatter) {com.lightandmatter = {};}

com.lightandmatter.Test =
  function (output_element,lexer,parser) {
      // testing input
      var testing_lines = [
                       // In the following, we can have:
                       //    [string,native] ... test that computing string gives an output that's equal to the native javascript typpe (number or boolean)
                       //    [string,string] ... test that the two strings evaluate to the same result
                       //    [string] ... test that the computation doesn't result in null or undefined
                       //    [] ... do nothing (placeholder for end of list, to avoid forgetting commas)
                       // The tolerance for comparisons is set by an optional third argument, eps.
                       // The magnitude of the difference between the results should be no more than eps.
                       // Eps defaults to 10^-12.
                       ["2+2",4],
                       ["1<3",true],
                       ["1>3",false],
                       ["1+d"],
                       ["1/d"],
                       ["d+d","2*d"],
                       ["d^2<d",true],
                       ["sqrt d > d",true],
                       ["2*d>d",true],
                       ["a:6*7;a+5",47],       // semicolon operator and side-effects
                       ["zzz:1;zzz=1",true],   // nopromote flag
                       ["f x:x^2;f(f(2))",16], // composition of functions
                       ["sqrt(-1)","i"],
                       ["((1+i)/(sqrt 2))^8",1],
                       ["(1,2,3)=(1,2,3)",true],
                       ["(1,2,3)=(1,2,4)",false],
                       ["((1,2),(3,4))=((1,2),(3,4))",true],
                       ["((1,2),3)=(1,2,3)",false], // closed_array, parens have extra significance beyond grouping in the case of arrays
                       ["array[1/(1-d)]=[[0,1],[1,1],[2,1],[3,1],[4,1]]",true],
                       ["array(exp(d))=[[0,1],[1,1],[2,0.5],[3,0.16666666666666666],[4,0.041666666666666664]]",true],
                       ["[sqrt(d+d^2)]^2","d+d^2"],
                       // "foo",
                       // "2d",  // the parser doesn't return anything for this line
                       [] // end of list
                       ]

      // this variable hold the input and output for the whole session.
      // I tried to make it work like the private variable "terminal" in Terminal.js
      // whatever is in debug2 will be overwritten. It could easily be changed to append 
      // results to the debug2 div.
      var testing_output = "";
      var nn =  com.lightandmatter.Num;

      for each (var test in testing_lines) {
        if (test.length>0) {
          line = test[0];

          var x,y,rx,ry;
          x = do_parse(lexer,parser,line);
          rx = x[0];
          rx = unstring_if_possible(rx);
          var parser_errors = x[1];
          var unequal = false;
          var diff;

          if (test.length>=2) { // comparing against a second expression
            var eps = 1e-12; // tolerance for comparisons, see explanation above
            if (test.length>=3) {eps=test[2];}
            if (typeof(test[1])=='string') {
              y = do_parse(lexer,parser,test[1]);
              ry = y[0];
              parser_errors += y[1];
              ry = unstring_if_possible(ry);
              if (typeof(rx)=='string' || typeof(ry)=='string') {
                unequal = rx.toString() != ry.toString();
              }
              else {
                diff = com.lightandmatter.Num.binop('-',rx,ry);
                //document.getElementById("debug").innerHTML += 'diff='+diff+nn.num_type(diff);
                if (typeof(diff)=='number') {diff=Math.abs(diff);} else {diff=diff.abs();}
                unequal = nn.binop('>',diff,eps);
              }
            }
            else { // compare expression versus native JS type
              ry = test[1];
              if (typeof(test[1])=='number') {
                if (rx!==null && ry!==null) {
                  diff = com.lightandmatter.Num.binop('-',rx,ry);
                  if (typeof(diff)=='number') {diff=Math.abs(diff);} else {diff=diff.abs();}
                  unequal = nn.binop('>',diff,eps);
                }
                else {
                  unequal = true;
                }
              }
              if (typeof(test[1])=='boolean') {
                if (rx=='true') {rx=true}
                if (rx=='false') {rx=false}
                unequal = (rx!=ry);
              }
            }
          }

          // TODO - add style
          testing_output += "testing " + html_armor(line);
          if (test.length>=2) {testing_output += ' = '+html_armor(test[1]);}
          if (unequal) {
            testing_output += "<br/>Unequal expressions, "+rx+" and "+ry+", types "
                               +typeof(rx)+','+typeof(ry)
                               +"**************** fail *******************<br/>";
          }
          else {
            testing_output += '...pass';
          }
          testing_output += "<br/>";
          if (parser_errors) {
            testing_output += "Parser Exception: " + parser_errors + "<br/>";
          }
          testing_output += rx;
          if (test.length>=2) {testing_output += ' = '+ry;}
          testing_output += "<br/>";
          output_element.innerHTML = testing_output;
        }
      }

      function html_armor(s) {
        if (typeof(s)!=='string') {return s;}
        return s.replace(new RegExp('\<',"g"),'&lt;');
      }

      function unstring_if_possible(s) {
        if (typeof(s)!=='string') {return s;}
        if (s=='0') {return 0;} // In some browsers, parseFloat() returns 0 on error, so eliminate that case.
        // parseFloat ignores trailing stuff that it can't parse, so check for that:
        if (s.match(/[di\(\)]/)) {return s;}
        var n = parseFloat(s);
        if (n===0 || isNaN(n)) {n= s;}
        return n;
      }
  
      function do_parse(lexer,parser,line) {
          lexer.change_text(line);
          parser.parse(lexer.tokens,lexer.props);
          
          var result = "";
          var parser_errors = "";
          try {
            //result = parser.toString();
            result = parser.tree_to_string(parser.tree);
          }
          catch (e) {
            parser_errors += e;
          }
          return [result,parser_errors];

      }
    
  };
