const normalizeBlocks = (content = "") => {
  if (!content) return [];

  const trimmed = content.trim();
  if (!trimmed) return [];

  const blocks = trimmed.match(/<p[^>]*>.*?<\/p>|<div[^>]*>.*?<\/div>|<li[^>]*>.*?<\/li>|<ul[^>]*>.*?<\/ul>|<ol[^>]*>.*?<\/ol>|<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
  if (blocks.length) {
    return blocks.map((block) => block.trim()).filter(Boolean);
  }

  return [trimmed];
};

const mergeDocumentContent = (currentContent = "", incomingContent = "", baseContent = "") => {
  const current = (currentContent || "").trim();
  const incoming = (incomingContent || "").trim();
  const base = (baseContent || "").trim();

  if (!incoming) return current;
  if (!current) return incoming;
  if (current === incoming) return current;
  if (base === current) return incoming;
  if (base === incoming) return current;

  const mergedBlocks = [];
  const seen = new Set();

  [...normalizeBlocks(current), ...normalizeBlocks(incoming)].forEach((block) => {
    const key = block.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      mergedBlocks.push(block);
    }
  });

  return mergedBlocks.join("");
};

module.exports = {
  mergeDocumentContent,
};
