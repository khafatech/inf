// Complex.js
// (c) 2009 B. Crowell, GPL 2 license
//
// This file provides a constructor, com.lightandmatter.Rational.
//

var com;
if (!com) {com = {};}
if (!com.lightandmatter) {com.lightandmatter = {};}


com.lightandmatter.Rational =
  function (x,y) {
    var c = {};

    c.x = x; // top; can be negative
    c.y = y; // bottom; supposed to be positive, but we'll fix it if it isn't
    if (c.y<0) {c.x= -c.x; c.y= -c.y;}
    c.mytype = 'q';

    c.clone = function () {return com.lightandmatter.Rational(c.x,c.y); };
    c.eq = function (b) {return c.x!==null && c.y!=null && c.x*b.y==c.y*b.x; };
    c.mul = function (b) { return com.lightandmatter.Rational(c.x*b.x,c.y*b.y); };
    c.div = function (b) { if (b.x==0) {return NaN;} return com.lightandmatter.Rational(c.x*b.y,c.y*b.x); };
    c.neg = function () { return com.lightandmatter.Rational(-c.x,c.y); };
    c.add = function (b) { return com.lightandmatter.Rational(c.x*b.y+b.x*c.y,c.y*b.y); };
    c.sub = function (b) { return c.add(b.neg()); };

    c.toString = function() {
      return c.x + '/' + c.y;
    };
    c.toNumber = function() {
      return c.x/c.y;
    };

    // add two numbers, which may be any combination of native js 'number' type and Rational; doesn't actually operate on c
    c.add_r = function(u,v) { 
      if (u===null || v===null) {return null;}
      // both are number:
      if (typeof(u)=='number' && typeof(v)=='number') {return u+v;}
      // both are rational:
      if (typeof(u)!='number' && typeof(v)!='number' && u.mytype=='q' && v.mytype=='q') {return u.add(v);}
      // one number, one rational:
      if (typeof(u)=='number') {return com.lightandmatter.Rational(u,1).add(v);}
      return c.add_r(v,u);
    };
    c.mul_r = function(u,v) { 
      if (u===null || v===null) {return null;}
      // both are number:
      if (typeof(u)=='number' && typeof(v)=='number') {return u*v;}
      // both are rational:
      if (typeof(u)!='number' && typeof(v)!='number' && u.mytype=='q' && v.mytype=='q') {return u.mul(v);}
      // one number, one rational:
      if (typeof(u)=='number') {return com.lightandmatter.Rational(u,1).mul(v);}
      return c.mul_r(v,u);
    };
    c.eq_r = function(u,v) { 
      if (u===null || v===null) {return null;}
      // both are number:
      if (typeof(u)=='number' && typeof(v)=='number') {return u==v;}
      // both are rational:
      if (typeof(u)!='number' && typeof(v)!='number' && u.mytype=='q' && v.mytype=='q') {return u.eq(v);}
      // one number, one rational:
      if (typeof(u)=='number') {return com.lightandmatter.Rational(u,1).eq(v);}
      return c.eq_r(v,u);
    };
    c.cmp_r = function(u,v) { 
      if (u===null || v===null) {return null;}
      // both are number:
      if (typeof(u)=='number' && typeof(v)=='number') {return u-v;}
      // both are rational:
      if (typeof(u)!='number' && typeof(v)!='number' && u.mytype=='q' && v.mytype=='q') {return com.lightandmatter.Rational(u,1).sub(v).toNumber;}
      // one number, one rational:
      if (typeof(u)=='number') {return c.cmp_r(com.lightandmatter.Rational(u,1),v);}
      return c.eq_r(v,u);
    };

    return c;

  };
