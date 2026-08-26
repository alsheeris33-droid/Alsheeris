const fs = require('fs');
let buf = fs.readFileSync('admin.html');
let text = buf.toString('utf8');

// Replace any line containing "Al Sheeri's - Admin</h1>" with a clean version
text = text.replace(/<h1>.*?Al Sheeri.*?- Admin<\/h1>/g, "<h1>Al Sheeri's - Admin</h1>");

// Also fix any other corrupted emoji lines - remove bytes that aren't valid
// Remove all characters outside basic printable ASCII + standard whitespace + common Unicode
text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

fs.writeFileSync('admin.html', text, 'utf8');
console.log('Done - admin.html fixed');
