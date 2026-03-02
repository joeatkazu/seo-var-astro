/** Recursively extract text from a HAST node */
function getText(node) {
  if (node.type === 'text') return node.value;
  if (node.children) return node.children.map(getText).join('');
  return '';
}

export function rehypeToc() {
  return (tree) => {
    const headings = [];
    let firstH2Index = -1;

    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      if (node.type === 'element' && node.tagName === 'h2') {
        if (firstH2Index === -1) firstH2Index = i;
        headings.push({ id: node.properties?.id ?? '', text: getText(node) });
      }
    }

    if (headings.length < 2 || firstH2Index === -1) return; // skip trivial posts

    const listItems = headings.map(({ id, text }) => ({
      type: 'element', tagName: 'li', properties: {},
      children: [{
        type: 'element', tagName: 'a', properties: { href: `#${id}` },
        children: [{ type: 'text', value: text }]
      }]
    }));

    const tocNode = {
      type: 'element', tagName: 'nav',
      properties: { className: ['blog-toc', 'not-prose'] },
      children: [
        {
          type: 'element', tagName: 'p', properties: { className: ['blog-toc__title'] },
          children: [{ type: 'text', value: 'Tartalomjegyzék' }]
        },
        { type: 'element', tagName: 'ol', properties: {}, children: listItems }
      ]
    };

    tree.children.splice(firstH2Index, 0, tocNode);
  };
}
