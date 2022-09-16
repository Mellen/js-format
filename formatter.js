const colourjs = (function()
{
  function ParseFail(message, pos)
  {
    this.message = message;
    this.pos = pos;
  }

  ParseFail.prototype.toString = function()
  {
    return `Character number ${this.pos} has the problem: "${this.message}"`;
  }

  let pos = 0;
  let code = '';

  const reservedWords = ['await', 'break', 'case', 'catch', 'class', 'const',
                         'continue', 'debugger', 'default', 'delete', 'do',
                         'else', 'enum', 'export', 'extends', 'false',
                         'finally', 'for', 'function', 'if', 'import', 'in',
                         'instanceof', 'new', 'null', 'return', 'super',
                         'switch', 'this', 'throw', 'true', 'try', 'typeof',
                         'var', 'void', 'while', 'with', 'yield'];

  const otherPunctuators = ['{', '(', ')', '[', ']', '.', '...', ';', ',', '<', '>', '<=', '>=', '==', '!=', '===', '!==', '+', '-', '*', '%', '**', '++', '--', '<<', '>>', '>>>', '&', '|', '^', '!', '~', '&&', '||', '??', '?', ':', '=', '+=', '-=', '*=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '&&=', '||=', '??=', '=>'];


  const booleanLiterals = ['true', 'false'];

  const nullLiteral = 'null';

  const bigIntLiteralSuffix = 'n';
  
  const hexdigit_re = /^(\d|[ABCDEFabcdef])$/;

  const NumericLiteralSeparator = '_';
  
  function RDP(code_in)
  {
    code = code_in;
  } 

  function isScript()
  {
    if(code.length > 0)
    {
      return isScriptBody();
    }
    return true;
  }

  function isScriptBody()
  {
    return isStatementList();
  }

  function isStatementList()
  {
    return isStatementItem() || (isStatementList() && isStatementItem());
  }

  function isStatementItem()
  {
    return isStatement() || isDeclaration();
  }

  function isStatement()
  {
BlockStatement[?Yield, ?Await, ?Return]
VariableStatement[?Yield, ?Await]
EmptyStatement
ExpressionStatement[?Yield, ?Await]
IfStatement[?Yield, ?Await, ?Return]
BreakableStatement[?Yield, ?Await, ?Return]
ContinueStatement[?Yield, ?Await]
BreakStatement[?Yield, ?Await]
[+Return] ReturnStatement[?Yield, ?Await]
WithStatement[?Yield, ?Await, ?Return]
LabelledStatement[?Yield, ?Await, ?Return]
ThrowStatement[?Yield, ?Await]
TryStatement[?Yield, ?Await, ?Return]
DebuggerStatement

  }

  function isDeclaration()
  {
     HoistableDeclaration[?Yield, ?Await, ~Default]
ClassDeclaration[?Yield, ?Await, ~Default]
LexicalDeclaration[+In, ?Yield, ?Await]

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
          if(isHexDigit(c))
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
          if(isHexDigit(c))
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

    let value = parseInt(codePoint, 16);

    if(value > 0x10FFFE)
    {
      throw new ParseFail(`The hexadecimal value ${codepoint} is too big to be a valid unicode character`);
    }
    
    return {r: result, cp: codepoint};
  }

  function identifier(c, next)
  {
    let id = identifierName(c, next)

    return {id: id, isValid: !reservedWords.includes(id)};
  }

  function identifierReference(c, next)
  {
    let id = '';
    let isValid = true;
    {id, isValid} = identifier(c, next);
    if(!isValid)
    {
      if(id !== 'yield' && id !== 'await')
      {
        throw new ParseFail(`${id} is not a valid identifier, as it is a reserved word.`)
      }
    }

    return id;
  }
  
  function identifierName(c, nextc)
  {
    let name = '';
    let {started, startChar} = isIdentifierStart(c, next);
    if(started)
    {
      name += startChar;
      let {c, nextc} = getChar();
      let {isPart, nextPart} = isIdentifierPart(c, nextc);
      while(isPart)
      {
        name += nextPart;
        {c, nextc} = getChar();
        {isPart, nextPart} = isIdentifierPart(c, nextc);
      }
      name += nextPart;
    }
    return name;
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

  function isIdentifierPart(c, nextc)
  {
    let str = c;
    if(c === '\\' && nextc =='u')
    {
      let {text, codePointstr} = getUnicodeEscapeSequence();
      let codePoint = parseInt(codePointstr, 16);
      c = String.fromCodePoint(codePoint);
      str = text;
    }

    return {gotIt: isIdentifierPartChar(c), text: str};
  }

  function isIdentifierStartChar(c)
  {
    return /^(\p{ID_Start}|\$|_)$/u.test(c);
  }

  function isIdentifierPartChar(c)
  {
    return /^(\p{ID_Continue}|\$|\u200C|\u200d)$/u.test(c);
  }

  function isOtherPunctuator()
  {
    throw new Error('haven\'t writen this yet');
  }

  function isNumericLiteral()
  {
    let isNumeric = false;
    return isNumeric;
  }

  function isHexDigit(c)
  {
    return hexdigit_re.test(c);
  }

  function hexDigits()
  {
    let number = '';
    let {digit, next} = getChar();
    if(isHexDigit(digit))
    {
      while(isHexDigit(digit) || digit == NumericLiteralSeparator && isHexDigit(next))
      {
        number += digit;
        {digit, next} = getChar();
      }
    }
    
    return number;
  }

  function hexLiteral()
  {
    let number = '';
    let {start, sep} = getChar();
    if(start === '0' && (sep === 'x' || sep === 'X'))
    {
      number = start + sep;
      number += hexDigits();
    }

    return number;
  }

  function isOctalDigit(c)
  {
      return /^01234567$/.test(c);
  }

  function isNonOctalDigit(c)
  {
    return (c === '8' || c === '9');
  }

  function legacyOctalInteger(start, digit)
  {
    let number = '';
    if(start === '0' && isOctalDigit(digit))
    {
      number += digit;
      let next;
      {digit, next} = getChar();
      while(isOctalDigit(digit))
      {
        number += digit;
        {digit, next} = getChar();
      }
    } 
    return number;
  }

  return RDP;
})();
