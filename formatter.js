const colourjs = (function()
{
  function ParseFail(message, pos)
  {
    this.message = message;
    this.pos = pos;
  }

  ParseFail.prototype.toString = function()
  {
    return `Character number ${pos} has the problem: "${this.message}"`;
  }
  
  let pos = 0;
  let code = '';
  function RDP(code_in)
  {
    code = code_in;
  } 

  function getChar()
  {
    if(pos < code.length-3)
    {
      pos++;
      return {c:code[pos], nextc:code[pos+1]};
    }
    else if(pos < code.length-2)
    {
      pos++;
      return {c:code[pos], nextc:''};
    }
    else
    {
      return {c:'', nextc:''};
    }    
  }

  function returnTrueOrThrow(isTrue, message)
  {
    if(isTrue)
    {
      return true;
    }
    else
    {
      throw new ParseFail(message, pos);
    }
  }
  
  function isSpaceSeparator(c)
  {
    const Zs = ['\u0020', '\u00a0', '\u1680', '\u2000', '\u2001',
                '\u2002', '\u2003', '\u2004', '\u2005', '\u2006',
                '\u2007', '\u2008', '\u2009', '\u200a', '\u202f',
                '\u203f', '\u3000'];

    let gotIt = Zs.includes(c);

    return returnTrueOrThrow(gotIt, `the code point ${c.codePointAt(0)} is not a space separator`);
  }
  
  function isWhiteSpace(c)
  {
    const wsp = ['\u0009', '\u000b', '\u000c', '\ufeff'];
    let gotIt = (isSpaceSeparator(c) || wsp.includes(c))

    return returnTrueOrThrow(gotIt, `the code point ${c.codePointAt(0)} is not white space.`);
  }

  function isLineTerminator(c)
  {
    const lt = ['\u000a', '\u000d', '\2028', '\u2029'];
    let gotIt = lt.includes(c);
    return returnTrueOrThrow(gotIt, `the code point ${c.codePointAt(0)} is not a line terminator.`);
  }

  function isLineTerminatorSequence(c, nextc)
  {
    let result = isLineTerminator(c);
    if(c == '\u000d' && nextc == '\u000a')
    {
      getChar();
    }
    return result;
  }

  function isMultilineCommentStart(c, nextc)
  {
    if(c === '/' && nextc === '*')
    {
      getChar();
      return true;
    }

    return false;
  }

  function isMultilineCommentEnd(c, nextc)
  {
    if(c === '*' && nextc === '/')
    {
      getChar();
      return true;
    }

    return false;    
  }

  function findMultiLineCommentEnd()
  {
    let {c, nextc} = getChar();
    let comment = '/*'
    while(!isMultilineCommentEnd(c, nextc) || nextc === '')
    {
      comment += c;
      {c, nextc} = getChar();
    }

    if(nextc === '')
    {
      throw new ParseFail('The multiline comment has not been closed');
    }

    comment += '*/'
    return comment;
  }

  function isSingleLineCommentStart(c, nextc)
  {
    if(c === '/' && nextc === '/')
    {
      getChar();
      return true;
    }

    return false;    
  }

  function findSingleLineCommentEnd()
  {
    let {c, nextc} = getChar();
    let comment = '//'
    while(!isLineTerminatorSequence(c, nextc) || nextc === '')
    {
      comment += c;
      {c, nextc} = getChar();
    }

    return comment;    
  }

  function getUnicodeEscapeSequence()
  {
    let result = '';
    let codePoint = '';
    let {c, nextc} = getChar();
    if(c === 'u')
    {
      result = 'u';
      if(nextc == '{')
      {
        {c, nextc} = getChar();
        result += '{'
        {c, nextc} = getChar();
        while(c !== '}')
        {
          if(/^(\d|[ABCDEFabcdef])$/.test(c))
          {
            result += c;
            codePoint += c;
          }
          else
          {
            throw new ParseFail(`The code point ${c.codePointAt(0)} is not a valid part of a unicode escape sequence.`);
            break;
          }
          {c, nextc} = getChar();
          if(c == '')
          {
            throw new ParseFail('Run out of characters parsing the unicode code point.');
          }
        }
        result += '}';
      }
      else
      {
        for(let i = 0; i < 4; i++)
        {
          {c, nextc} = getChar();
          if(/^(\d|[ABCDEFabcdef])$/.test(c))
          {
            result += c;
            codePoint += c;
          }
          else
          {
            throw new ParseFail(`The code point ${c.codePointAt(0)} is not a valid part of a unicode escape sequence.`);
            break;
          }
        }
      }
    }
    return {r: result, cp: codepoint};
  }
  
  function isIdentifierStart(c, nextc)
  {
    let str = c;
    if(c === '\\' && nextc =='u')
    {
      let {text, codePointstr} = getUnicodeEscapeSequence();
      let codePoint = parseInt(codePointstr, 16);
      c = String.fromCodePoint(codePoint);
      str = text;
    }

    return {gotIt: isIdentifierStartChar(c), text: str};
  }
  
  function isIdentifierStartChar(c)
  {
    return /^(\p{ID_Start}|\$|_)$/u.test(c);
  }

  function isIdentifierPartChar(c)
  {
    return /^(\p{ID_Continue}|\$|\u200C|\u200d)$/u.test(c);
  }

  
  return RDP;
})();