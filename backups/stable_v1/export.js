/* ═══════════════════════════════════════════
   VoxTag — XML Export (SimpleReplay format)
   ═══════════════════════════════════════════ */

const VoxExport = (() => {
    
    function generateXML(events) {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<file>\n`;
        xml += `  <ALL_INSTANCES>\n`;

        events.forEach((evt, idx) => {
            xml += `    <instance>\n`;
            xml += `      <ID>${idx + 1}</ID>\n`;
            xml += `      <start>${evt.start_sec.toFixed(2)}</start>\n`;
            xml += `      <end>${evt.end_sec.toFixed(2)}</end>\n`;
            xml += `      <code>${escapeXml(evt.label)}</code>\n`;
            xml += `    </instance>\n`;
        });

        xml += `  </ALL_INSTANCES>\n`;
        xml += `</file>\n`;
        return xml;
    }

    function escapeXml(unsafe) {
        return unsafe.toString().replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    function download(content, filename = 'voxtag_export.xml') {
        const blob = new Blob([content], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return { generateXML, download };
})();
