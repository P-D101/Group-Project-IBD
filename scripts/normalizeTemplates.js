// Run this script with: node scripts/normalizeTemplates.js
// It will update frontend/src/data/templates.json in place.

const fs = require('fs');
const path = require('path');

const BLOCK_DESCRIPTIONS = {
  input: 'Input value',
  const: 'Constant value',
  add: 'Add',
  subtract: 'Subtract',
  multiply: 'Multiply',
  divide: 'Divide',
  lt: 'Less than (<)',
  gt: 'Greater than (>)',
  eq: 'Equals (=)',
  and: 'AND',
  or: 'OR',
  output: 'Create ticket/notification',
};

const BLOCK_LABELS = {
  and: 'AND',
  or: 'OR',
  output: {
    'Create Ticket': 'Create Ticket',
    'Send Notification': 'Send Notification',
    'Log Event': 'Log Event',
    'Notify Team': 'Send Notification',
    'Log Event': 'Log Event',
  },
};

const filePath = path.join(__dirname, '../src/data/templates.json');
const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

for (const template of json) {
  for (const node of template.Nodes) {
    // Normalize type
    if (node.type === 'ticket') node.type = 'output';
    if (node.type === 'and' || node.type === 'or') {
      node.label = BLOCK_LABELS[node.type];
    }
    if (node.type === 'output') {
      // Normalize output labels
      if (BLOCK_LABELS.output[node.label]) {
        node.label = BLOCK_LABELS.output[node.label];
      }
    }
    // Add description
    if (!node.description || node.description.trim() === '') {
      node.description = BLOCK_DESCRIPTIONS[node.type] || node.type;
    }
  }
}

fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
console.log('templates.json normalized!');
