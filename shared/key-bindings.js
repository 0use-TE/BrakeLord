export const DEFAULT_KEYS = [ 'KeyA', 'KeyL', 'KeyS', 'KeyK' ];
const names={Space:'空格',Enter:'Enter',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',
 ShiftLeft:'左 Shift',ShiftRight:'右 Shift',ControlLeft:'左 Ctrl',ControlRight:'右 Ctrl',AltLeft:'左 Alt',AltRight:'右 Alt',
 Backspace:'退格',Delete:'Delete',Insert:'Insert',Home:'Home',End:'End',PageUp:'Page Up',PageDown:'Page Down',CapsLock:'Caps Lock',
 NumpadAdd:'小键盘 +',NumpadSubtract:'小键盘 −',NumpadMultiply:'小键盘 ×',NumpadDivide:'小键盘 ÷',NumpadDecimal:'小键盘 .',NumpadEnter:'小键盘 ↵',NumpadEqual:'小键盘 =',
 Semicolon:';',Equal:'=',Comma:',',Minus:'−',Period:'.',Slash:'/',Backquote:'`',BracketLeft:'[',Backslash:'\\',BracketRight:']',Quote:"'"};
export function supportedKey(code){return typeof code==='string'&&(/^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|F([1-9]|1[0-2]))$/.test(code)||Object.hasOwn(names,code));}
export function keyLabel(code){
 if(/^Key[A-Z]$/.test(code))return code.slice(3);
 if(/^Digit[0-9]$/.test(code))return code.slice(5);
 if(/^Numpad[0-9]$/.test(code))return '小键盘 '+code.slice(6);
 return names[code]||code;
}
export function bindingsFromCodes(codes=DEFAULT_KEYS){
 if(!Array.isArray(codes)||codes.length!==4||codes.some(c=>!supportedKey(c))||new Set(codes).size!==4)throw Error('键位必须有效且互不重复');
 return codes.map(code=>({code,label:keyLabel(code)}));
}
export function assignBinding(bindings,index,code,activeCount){
 if(!supportedKey(code))return {error:'此键暂不可用，请换一个键。'};
 const conflict=bindings.findIndex((key,i)=>i!==index&&key.code===code);
 const active=Array.isArray(activeCount)?activeCount:Array.from({length:activeCount},(_,i)=>i);
 if(conflict>=0&&active.includes(conflict))return {error:'这个键已被 P'+(conflict+1)+' 使用。'};
 const result=bindings.map(key=>({...key}));
 if(conflict>=0)result[conflict]={...bindings[index]}; // 未出场玩家让出该键，仍保持四个键唯一。
 result[index]={code,label:keyLabel(code)};return {bindings:result};
}
