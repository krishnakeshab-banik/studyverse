function formatTime(ms) {
    if (ms < 1000) return "0s";
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ${secs % 60}s`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
}

chrome.storage.local.get(['domainData'], (res) => {
   const data = res.domainData || {};
   const sorted = Object.entries(data).sort((a,b) => b[1] - a[1]);
   
   const statsDiv = document.getElementById('stats');
   if (sorted.length === 0) {
      statsDiv.innerHTML = "<div style='text-align:center; padding: 10px;'>No data recorded yet.</div>";
   } else {
      let html = "";
      sorted.slice(0, 5).forEach(([domain, ms]) => {
         html += `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 4px;">
           <span style="font-weight: bold; color: #ddd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">${domain}</span>
           <span style="color: #818cf8;">${formatTime(ms)}</span>
         </div>`;
      });
      statsDiv.innerHTML = html;
   }
});

document.getElementById('reset').addEventListener('click', () => {
  if (confirm("Are you sure you want to clear your analytics data?")) {
     chrome.storage.local.set({ domainData: {} }, () => {
       alert('Analytics data reset successfully!');
       window.close();
     });
  }
});

document.getElementById('openApp').addEventListener('click', () => {
  chrome.tabs.create({ url: "http://localhost:3000/analytics" });
});
