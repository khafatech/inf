// Terminal.js
// (c) 2007 B. Crowell and M. Khafateh, GPL 2 license
//
// This file provides a constructor, com.lightandmatter.Terminal, which simulates an interactive terminal
// window.
//
// Basic use:
//   <body onload = "set_up();">
//     <div id="terminal" style="width:100%; height:300px;"></div>
//     <script src="Terminal.js"></script>
//     <script>
//       function set_up() {
//         var terminal = new com.lightandmatter.Terminal({
//           'container':document.getElementById("terminal"),
//           'response':(function(terminal) {return "Your input was "+terminal.input})
//         });
//       }
//     </script>
//   </body>
//
// The constructor takes a single object as an argument. Its properties are as follows:
//   container    : an object corresponding to a div element which will contain the terminal
//   response     : a function that generates a response to a line of the user's input; should accept the Terminal object as its argument
//   prompt       : HTML code to be used as a prompt for user input
//   input_width  : the width (in characters) of the input field for the user
//   style        : a basic CSS style to be used for the whole terminal
//   input_style  : additional CSS styling to be applied to the input field
//   above_style  : additional CSS styling to be applied to everything above the input field
//   when_changed : a function to call on every keystroke
// All of these except for container have defaults.
// Public methods:
//   input        : the user's most recent line of input, or undefined (read-only)
//   history      : an array of strings containing all the user's lines of input, including the most recent one (read-only)
//
// Implementation:
// - Normally, whenever the user hits enter in a text input field, it submits the form. We don't want that, so we set the onkeypress
//   event handler for the input so as to handle the enter key the way we want. As a side-effect of this, onchange never gets
//   triggered, but that's okay, because we can still detect that they hit enter.
// - Normally a scrolled div defaults to having the scrollbar at the top. To get it to scroll to the bottom, it should suffice to
//   have the text input field inside the scrolled area, and give it the focus. However, there seem to be some cases where that
//   doesn't work correctly in Firefox, and that's the reason for the "bottom" div, and the call to scrollIntoView.
// - The default in Firefox, for example, is to have a serif font for html text, and sans serif for user input. This would make
//   the user's input suddenly change in style as it scrolled upward after the user hit enter. To avoid this, the default is
//   to set serif as the input style.
// Emacs keybindings: ctl-p works in firefox without firemacs, doesn't work with firemacs. Doesn't work with konqueror. Works in galeon.
//
// To do:
//   Provide a way for the user to clear the terminal, and call a handler routine when that happens.
//   More flexibility in details of styling.
//   Handle multi-line responses correctly.
//   Let everything be wrapped in <p></p> if they want that, rather than just using <br/> tags.
//   If style includes color, does that work? Maybe not, need to apply that style to the whole hierarchy of divs.
//   Fix strange behavior when you paste text in. I think this is because it's assuming it's getting a keyboard event for every character.

var com;
if (!com) {com = {};}
if (!com.lightandmatter) {com.lightandmatter = {};}

com.lightandmatter.Terminal =
  function (args) {
    this.container = args.container;
    this.response = function(terminal) {return "";};
    if ('response' in args) {this.response = args.response;}
    this.prompt = '&gt; ';
    if ('prompt' in args) {this.prompt = args.prompt;}
    this.input_width = 100;
    if ('input_width' in args) {this.input_width = args.input_width;}
    this.style = "font-family:serif;";
    if ('style' in args) {this.style = args.style;}
    this.input_style = "border-style:none;";
    if ('input_style' in args) {this.input_style = args.input_style;}
    this.above_style = "";
    if ('above_style' in args) {this.above_style = args.above_style;}
    this.when_changed = function() {};
    if ('when_changed' in args) {this.when_changed = args.when_changed;}

    var scroll_div = document.createElement("div");
    scroll_div.setAttribute("style","width:100%; height:100%; overflow:auto"); // width is required in order to get the scrollbar
    this.terminal_div = document.createElement("div");
    scroll_div.appendChild(this.terminal_div);
    var form = document.createElement("form");
    scroll_div.appendChild(form);
    var prompt_span = document.createElement("span");
    prompt_span.innerHTML = this.prompt;
    form.appendChild(prompt_span);
    var inp = document.createElement("input");
    inp.setAttribute("type","text");
    inp.setAttribute("size",String(this.input_width));
    inp.setAttribute("style",this.style+this.input_style);
    form.appendChild(inp);
    var bottom = document.createElement("div");
    form.appendChild(bottom);
    this.container.appendChild(scroll_div);

    var terminal = ''; // private data; a string holding the contents of the simulated terminal window
    this.terminal_div.innerHTML = terminal;
    inp.value = '';

    this.history = [];
    this.in_history = 0;

    var t = this; // In the event-handler, "this" means the inp object, not the Terminal, so provide this closure.
    inp.onkeypress = function(e) {

      var code = 0;

      if (!e) { // IE
        e = window.event;
      }
      // IE has keyCode, Firefox has charCode
      try { code = e.charCode; } catch (foo) {}
      try { code = e.keyCode;  } catch (foo) {}
      if (code==0) {try { code = e.which;  } catch (foo) {}} // necessary for ctl keys in FF
      var special = false;
      try {special=(e.which!==undefined && e.which===0)} catch (foo) {}
      var enter = 13; // unicode for enter key
      // Most browsers don't generate a keypress for arrow keys. Firefox does.
      var up_arrow = 38;
      var down_arrow = 40;
      var ch = String.fromCharCode(code);
      var go_up = special && ((e.ctrlKey && ch=='p') || (code==up_arrow));
      var go_down = special && ((e.ctrlKey && ch=='n') || (code==down_arrow));
      if (go_up || go_down) {
        if (go_up) {t.in_history --;}
        if (go_down) {t.in_history ++;}
        if (t.in_history<0) {t.in_history=0;}
        if (t.in_history>t.history.length) {t.in_history=t.history.length;}
        if (t.in_history<t.history.length) {this.value = t.history[t.in_history];}
        if (t.in_history==t.history.length) {this.value = '';}
      }
      if (code==enter) {
        var u = this.value;  // user's input, not including the most recent character
        u = u.replace(new RegExp("<","g"),"&lt;");
        t.input = u;
        t.history.push(u);
        t.in_history = t.history.length;
        terminal =   terminal +
                    '<span style="' + t.style + t.above_style + '">' + t.prompt + " " +  u + "</span><br/>"  +
                    '<span style="' + t.style + t.above_style + '">' + t.response(t) + "</span><br/>";
        this.value=''; // clear input field
        t.terminal_div.innerHTML = terminal;
        bottom.scrollIntoView(false);
      }
      return (!(code==enter || go_up || go_down)); // in these three cases, prevent the browser from doing other things, e.g., printing if we do control-p
    };
    inp.onkeyup = function(e) {
      t.when_changed(this.value);
    };
    inp.focus();
  };
