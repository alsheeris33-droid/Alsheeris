const fs = require('fs');
let text = fs.readFileSync('admin.html', 'utf8');
text = text.replace(/<h1>.*?Al Sheeri.*?- Admin<\/h1>/g, "<h1>Al Sheeri's - Admin</h1>");
text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
fs.writeFileSync('admin.html', text, 'utf8');
console.log('Done - admin.html fixed');
