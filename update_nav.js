const fs = require('fs');
const files = [
  'app/study/page.tsx', 'app/profile/page.tsx', 'app/marketplace/page.tsx', 
  'app/library/page.tsx', 'app/doubts/page.tsx', 'app/calendar/page.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('Activity')) {
    content = content.replace('} from "lucide-react"', ', Activity } from "lucide-react"');
  }

  const targetLink = '{ label: "Post Doubts",   href: "/doubts",      icon: <MessageSquare size={24} className="text-neutral-400 flex-shrink-0" /> },';
  const newLinks = targetLink + '\n  { label: "Analytics",     href: "/analytics",   icon: <Activity      size={24} className="text-neutral-400 flex-shrink-0" /> },';
  
  const targetLink2 = '{ label: "Post Doubts",   href: "/doubts",      icon: <MessageSquare size={24} className="text-indigo-400 flex-shrink-0" /> },';
  const newLinks2 = targetLink2 + '\n  { label: "Analytics",     href: "/analytics",   icon: <Activity      size={24} className="text-neutral-400 flex-shrink-0" /> },';
  
  content = content.replace(targetLink, newLinks).replace(targetLink2, newLinks2);
  fs.writeFileSync(f, content);
  console.log('Updated', f);
});
