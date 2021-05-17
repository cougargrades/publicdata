const fs = require('fs');

// if enough arguments provided
if(process.argv.length > 2) {
  const tag = process.argv[2];
  console.log(tag);
  const package = require('./package.json');
  package.version = `1.0.0-${tag}`;
  fs.writeFileSync('./package.json', JSON.stringify(package, undefined, 2));
}
