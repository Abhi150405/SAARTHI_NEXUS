const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/Signup.jsx',
    'src/pages/StudentLogin.jsx',
    'src/pages/Notifications.jsx',
    'src/pages/Login.jsx',
    'src/pages/Experiences.jsx',
    'src/pages/Eligibility.jsx',
    'src/pages/Dashboard.jsx',
    'src/pages/CompanyRecords.jsx',
    'src/pages/AdminLogin.jsx',
    'src/pages/AdminDashboard.jsx',
    'src/components/NotificationBar.jsx'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');

        // Add import if not present
        if (!content.includes("import { API_URL }")) {
            // Find the last import statement
            const importRegex = /^import .+;?/gm;
            let lastImportIndex = -1;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                lastImportIndex = match.index + match[0].length;
            }

            // Calculate relative path to config
            let slashCount = (file.match(/\//g) || []).length;
            let relativePath = '../'.repeat(slashCount - 1) + (slashCount === 1 ? './' : '') + 'config';
            if (file.startsWith('src/')) {
                const depth = file.split('/').length - 2; // src/pages/Signup.jsx -> 1
                relativePath = depth > 0 ? '../'.repeat(depth) + 'config' : './config';
            }

            const importStmt = `\nimport { API_URL } from '${relativePath}';`;
            if (lastImportIndex !== -1) {
                content = content.slice(0, lastImportIndex) + importStmt + content.slice(lastImportIndex);
            } else {
                content = importStmt + '\n' + content;
            }
        }

        // Replace 'http://localhost:5000' and "http://localhost:5000" with `${API_URL}`
        content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, '`${API_URL}$1`');
        content = content.replace(/"http:\/\/localhost:5000([^"]*)"/g, '`${API_URL}$1`');

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
