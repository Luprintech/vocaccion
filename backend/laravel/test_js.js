const fs = require('fs');

const content = fs.readFileSync('dump2.txt', 'utf8');
const careerText = content.split('## 4. Top 3 Caminos Profesionales')[1].split('## 5. Áreas de Crecimiento')[0];
const careerBlocks = careerText.split(/\n(?=###|\*\*[A-ZÁÉÍÓÚÜÑ])/);

const careers = careerBlocks.map(block => {
    const titleMatch = block.match(/###\s*(.+?)$|^\s*\d+\.\s*\*\*(.+?)\*\*|^\*\*(.+?)\*\*/m);
    if (!titleMatch) return null;
    const title = (titleMatch[1] || titleMatch[2] || titleMatch[3] || '').replace(/\*\*/g, '').trim();

    const compatMatch = block.match(/[Cc]ompatibilidad[^:]*:\*?\*?\s*(\d+)\s*%(?:[^\n(]*(\([^)]+\)))?/);
    const compat = compatMatch ? +compatMatch[1] : 75;
    const compatDetails = compatMatch?.[2] || '';

    const extractSub = (labels) => {
        const rx = new RegExp(`(?:\\*\\*|###)?\\s*(?:${labels})[^\\n:]*:?\\*?\\*?\\s*\\n?([\\s\\S]*?)(?=\\n[ \\t]*[-*]*\\s*\\*?\\*?(?:Por qu[ée] encaja|Salidas laborales|Formaci[óo]n recomendada|Primeros 3 pasos|Primeros pasos|Compatibilidad)(?:[\\s:]|$)|$)`, 'i');
        const match = block.match(rx);
        return match ? match[1].trim() : '';
    };

    const whyRaw = extractSub('Por qu[ée] encaja');
    const why = whyRaw.replace(/^[ \t]*[-*]\s*/gm, '').replace(/\*\*/g, '').trim();

    const salidasRaw = extractSub('Salidas laborales');
    const salidas = salidasRaw.split(/\n/)
        .map(l => l.replace(/^[ \t]*[-*]\s*/, '').replace(/\*\*/g, '').trim())
        .filter(l => l && l !== '*' && l !== '-');

    const formacionRaw = extractSub('Formaci[óo]n recomendada');
    const formacionText = formacionRaw.replace(/^[ \t]*[-*]\s*/gm, '').replace(/\*\*/g, '').trim();
    const formacionLines = formacionRaw.split(/\n/)
        .map(l => l.replace(/^[ \t]*[-*]\s*/, '').replace(/\*\*/g, '').trim())
        .filter(l => l && l !== '*' && l !== '-');
    const formacion = formacionLines.length > 1 ? formacionLines : formacionText;

    const stepsRaw = extractSub('Primeros(?: 3)? pasos');
    const steps = stepsRaw.split(/\n/)
        .map(l => l.replace(/^[ \t]*(?:\d+\.|\*|-)\s*/, '').replace(/\*\*/g, '').trim())
        .filter(l => l && l !== '*' && l !== '-');

    return { title, compat, compatDetails, why, salidas, formacion, steps };
}).filter(b => b && b.title).slice(0, 3);

fs.writeFileSync('test_out.json', JSON.stringify(careers, null, 2));

console.log("Done");
