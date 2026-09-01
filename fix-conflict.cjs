const fs = require('fs');
let text = fs.readFileSync('admin.html', 'utf8');
// Remove ALL non-ASCII characters (emojis and mojibake) - they are decorative only
// Keep only standard ASCII printable + newline + tab + carriage return
text = text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
fs.writeFileSync('admin.html', text, 'utf8');
console.log('All non-ASCII chars removed from admin.html');
