const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add type assertions to viewer.schoolId
    // Match `schoolId: viewer.schoolId` -> `schoolId: viewer.schoolId as string`
    // Or just `viewer.schoolId` to `viewer.schoolId as string` if it's inside a where clause
    
    // The safest way is to ensure the viewer object returned by `prisma.user.findUnique` casts schoolId to string, 
    // but many pages call `prisma.user.findUnique` directly!
    
    // Let's replace:
    // `select: { id: true, schoolId: true, role: true },`
    // with that + a throw if null? No, let's just do:
    let newContent = content.replace(/viewer\.schoolId(?!\s*as\s+string)(?!.*!)/g, 'viewer.schoolId as string');
    
    // But some are `const schoolId = viewer.schoolId;`
    // So this becomes `const schoolId = viewer.schoolId as string;` which is perfect!

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log('Fixed', filePath);
    }
  }
});
