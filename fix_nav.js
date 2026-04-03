const fs = require('fs');
const files = [
  'app/study/page.tsx', 'app/profile/page.tsx', 'app/marketplace/page.tsx', 
  'app/library/page.tsx', 'app/doubts/page.tsx', 'app/calendar/page.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/,\n, Activity } from "lucide-react"/g, ',\n  Activity\n} from "lucide-react"');
  content = content.replace(/\n, Activity } from "lucide-react"/g, ',\n  Activity\n} from "lucide-react"');
  fs.writeFileSync(f, content);
  console.log('Fixed', f);
});
