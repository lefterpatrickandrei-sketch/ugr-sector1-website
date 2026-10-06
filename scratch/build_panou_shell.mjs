import fs from 'fs';

const raw = fs.readFileSync('admin/panou.legacy.html', 'utf8');
const lines = raw.split(/\r?\n/);
console.log('Total lines in legacy:', lines.length);

// head is lines 0..8 (1 to 9)
const head = lines.slice(0, 9);
head.push('    <link rel="stylesheet" href="css/panel.css">');
head.push('</head>');
head.push('<body>');

// body is lines 2093 to 3194 (indices 2093 to 3194)
// Let's verify line 2093 and 3194
console.log('Line 2093 in legacy:', lines[2092]); // should be </head> or <body>
console.log('Line 2094 in legacy:', lines[2093]); // should be <body> or comment
console.log('Line 3193 in legacy:', lines[3193]); // should be </div> of bulkbar
console.log('Line 3194 in legacy:', lines[3194]);

const body = lines.slice(2094, 3194);

const foot = [
  '',
  '    <!-- CMS Studio Orchestrator (ES Module) -->',
  '    <script type="module" src="js/main.js"></script>',
  '</body>',
  '</html>',
  ''
];

const newHtml = [...head, ...body, ...foot].join('\n');
fs.writeFileSync('admin/panou.html', newHtml, 'utf8');
console.log('Successfully written admin/panou.html. Line count:', newHtml.split('\n').length);
