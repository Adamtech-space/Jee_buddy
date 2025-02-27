export function parseContent(content) {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const elements = [];

  for (const line of lines) {
    if (line.startsWith('Title:')) {
      continue;
    } else if (line.startsWith('H1:')) {
      elements.push({
        type: 'h1',
        content: line.replace('H1:', '').trim()
      });
    } else if (line.startsWith('H2:')) {
      elements.push({
        type: 'h2',
        content: line.replace('H2:', '').trim()
      });
    } else if (line.startsWith('Body:')) {
      elements.push({
        type: 'p',
        content: line.replace('Body:', '').trim()
      });
    } else if (line.trim()) {
      elements.push({
        type: 'p',
        content: line.trim()
      });
    }
  }

  return elements;
}
