// Test.js
// (c) 2007 B. Crowell and M. Khafateh, GPL 2 license
//
// This file provides a constructor, com.lightandmatter.Test.
//
// to do:
//   tolerate small rounding errors
//   fix the ones that actually fail

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
                       ["2+2",4],
                       ["1<3",true],
                       ["1>3",false],
                       ["1+d"],
                       ["1/d"],
                       ["d+d","2*d"],
                       ["2*d>d",true],
                       ["a:6*7;a+5",47],
                       ["f x:x^2"],            // define f for next test
                       ["f(f(2))",16],         // composition of functions
                       ["sqrt(-1)","i"],
                       ["((1+i)/(sqrt 2))^8",1],
                       ["zzz:1;zzz=1",true],       // fails**************
                       // "foo",
                       // "2d",  // the parser doesn't return anything for this line
                       [] // end of list
                       ]

      // this variable hold the input and output for the whole session.
      // I tried to make it work like the private variable "terminal" in Terminal.js
      // whatever is in debug2 will be overwritten. It could easily be changed to append 
      // results to the debug2 div.
      var testing_output = "";

      for each (var test in testing_lines) {
        if (test.length>0) {
          line = test[0];

          var x,y,rx,ry;
          x = do_parse(line);
          rx = x[0];
          var parser_errors = x[1];
          var unequal = false;

          if (test.length>=1) {
            if (typeof(test[1])=='string') {
              y = do_parse(test[1]);
              ry = y[0];
              parser_errors += y[1];
              if (typeof(rx)=='string' || typeof(ry)=='string') {
                unequal = rx.toString != ry.toString;
              }
              else {
                unequal = !com.lightandmatter.Num.binop('=',rx,ry);
              }
            }
            else {
              ry = test[1];
              if (typeof(test[1])=='number') {
                unequal = (rx != ry);
              }
              if (typeof(test[1])=='boolean') {
                if (rx=='true') {rx=true}
                if (rx=='false') {rx=false}
                unequal = (rx!=ry);
              }
            }
          }

          // TODO - add style
          testing_output += "testing " + line + "<br/>";
          if (unequal) {
            testing_output += "Unequal expressions, "+rx+" and "+ry+", types "+typeof(rx)+','+typeof(ry)+"<br/>";
          }

          if (parser_errors) {
            testing_output += "Parser Exception: " + parser_errors + "<br/>";
          }
          testing_output += rx + "<br/>";
          output_element.innerHTML = testing_output;
        }
      }
  
      function do_parse(line) {
          lexer.change_text(line);
          parser.parse(lexer.tokens,lexer.props);
          
          var result = "";
          var parser_errors = "";
          try {
            result = parser.toString();
          }
          catch (e) {
            parser_errors += e;
          }
          return [result,parser_errors];

      }
    
  };
