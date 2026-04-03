const fs = require('fs');
const files = [
  'app/study/page.tsx', 'app/profile/page.tsx', 'app/marketplace/page.tsx', 
  'app/library/page.tsx', 'app/doubts/page.tsx', 'app/calendar/page.tsx', 'app/analytics/page.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // Add FolderGit2 import if not present
  if (!content.includes('FolderGit2')) {
    content = content.replace('Activity } from "lucide-react"', 'Activity, FolderGit2 } from "lucide-react"');
    content = content.replace(', Activity\n} from "lucide-react"', ', Activity, FolderGit2\n} from "lucide-react"');
  }
  
  // Add Projects nav link after Marketplace and before Calendar (if not already present)
  if (!content.includes('href: "/projects"')) {
    content = content.replace(
      '{ label: "Calendar",      href: "/calendar",    icon: <CalendarDays  size={24} className="text-neutral-400 flex-shrink-0" /> },',
      '{ label: "Calendar",      href: "/calendar",    icon: <CalendarDays  size={24} className="text-neutral-400 flex-shrink-0" /> },\n  { label: "Projects",      href: "/projects",    icon: <FolderGit2    size={24} className="text-neutral-400 flex-shrink-0" /> },'
    );
  }
  
  fs.writeFileSync(f, content);
  console.log('Updated', f);
});
