const fs = require('fs');
const text = `Analicemos cada dimensión dominante:

* Investigador (I): Esta es tu dimensión más fuerte. Refleja una profunda curiosidad intelectual y un deseo innato de explorar ideas, resolver problemas complejos y comprender cómo funcionan las cosas. Te sientes atraído por el análisis de datos, la investigación, la teoría y la experimentación. * Estilo de trabajo preferido: Independiente, analítico, basado en la lógica y la evidencia. Te gusta tener tiempo para pensar, investigar y profundizar en los temas. * Tipo de tareas que disfruta: Diseñar experimentos, analizar datos, desarrollar teorías, investigar nuevas soluciones, resolver enigmas complejos, escribir informes técnicos o científicos. * Entorno laboral ideal: Un ambiente que fomente la autonomía intelectual, el pensamiento crítico y el acceso a recursos para la investigación. Laboratorios, centros de I+D, universidades, think tanks o startups innovadoras serían ideales. * Fortalezas naturales: Pensamiento crítico, objetividad, precisión, curiosidad, capacidad de síntesis, lógica, habilidades de investigación.

* Emprendedor (E): Tu segunda dimensión más destacada. Complementa tu naturaleza investigadora con un fuerte impulso hacia la acción, el liderazgo y la influencia. No te conformas con solo entender; quieres aplicar ese conocimiento para generar impacto, iniciar proyectos y dirigir a otros hacia un objetivo. * Estilo de trabajo preferido: Dinámico, persuasivo, orientado a resultados, estratégico y con una clara vocación de liderazgo.`;

const RIASEC_LABELS = { R: 'Realista', I: 'Investigador', A: 'Artístico', S: 'Social', E: 'Emprendedor', C: 'Convencional' };

let paragraphs = text.split(/\n{2,}/);
let cleanedParagraphs = [];
let dynamicDetails = {};

for (let p of paragraphs) {
    let matchedDimName = null;
    let dimLetter = null;

    for (const [letter, label] of Object.entries(RIASEC_LABELS)) {
        let baseLabel = label === 'Artístico' ? 'Art[íi]stico' : label;
        const rx = new RegExp(`^[\\s\\*\\-]*\\*?\\*?${baseLabel}\\s*(?:\\([RIASEC]\\))?\\*?\\*?\\s*[:-]`, 'i');
        if (rx.test(p)) {
            matchedDimName = baseLabel;
            dimLetter = letter;
            break;
        }
    }

    if (dimLetter) {
        const prefixRx = new RegExp(`^[\\s\\*\\-]*\\*?\\*?${matchedDimName}\\s*(?:\\([RIASEC]\\))?\\*?\\*?\\s*[:-]\\s*`, 'i');
        let pContent = p.replace(prefixRx, '');

        const extractField = (labels) => {
            const lookahead = `(?=(?:[^\\w]|^)\\*?\\*?(?:Estilo de trabajo|Tipo de tareas|Tipo de actividades|Entorno laboral|Fortalezas|Entorno ideal)[a-zA-Z\\s]*\\*?\\*?\\s*[:\\-]|$)`;
            const pattern = `(?:[^\\w]|^)\\*?\\*?(?:${labels})[a-zA-Z\\s]*\\*?\\*?\\s*[:\\-]\\s*([\\s\\S]*?)${lookahead}`;
            const rx = new RegExp(pattern, 'i');
            const m = pContent.match(rx);
            return m ? m[1].replace(/^[*\s]+|[*\s]+$/g, '').trim() : null;
        };

        const workStyle = extractField('Estilo de trabajo');
        const tasks = extractField('Tipo de tareas|Tipo de actividades');
        const environment = extractField('Entorno laboral|Entorno ideal');
        const strengths = extractField('Fortalezas');

        let descEndIndex = pContent.length;
        const fields = ['Estilo de trabajo', 'Tipo de tareas', 'Tipo de actividades', 'Entorno laboral', 'Fortalezas', 'Entorno ideal'];
        for (let f of fields) {
            const labelR = new RegExp(`([^\\w]|^)\\*?\\*?${f}`, 'i');
            const rx = pContent.match(labelR);
            if (rx && rx.index < descEndIndex) {
                descEndIndex = rx.index;
            }
        }
        const description = (descEndIndex > 0) ? pContent.substring(0, descEndIndex).trim().replace(/^[*\s]+|[*\s]+$/g, '') : pContent.trim();

        dynamicDetails[dimLetter] = { description, workStyle, tasks, environment, strengths };
    } else {
        cleanedParagraphs.push(p);
    }
}

fs.writeFileSync('test_out.json', JSON.stringify({ cleanedParagraphs, dynamicDetails }, null, 2));
