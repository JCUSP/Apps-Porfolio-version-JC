const state = {
  products: [],
  activeFamily: "Todos",
  query: "",
  view: "cards",
};

const elements = {
  familyFilters: document.querySelector("#familyFilters"),
  searchInput: document.querySelector("#searchInput"),
  clearFiltersButton: document.querySelector("#clearFiltersButton"),
  cardsView: document.querySelector("#cardsView"),
  tableView: document.querySelector("#tableView"),
  tableBody: document.querySelector("#productsTableBody"),
  emptyState: document.querySelector("#emptyState"),
  resultTitle: document.querySelector("#resultTitle"),
  resultMeta: document.querySelector("#resultMeta"),
  productCount: document.querySelector("#productCount"),
  familyCount: document.querySelector("#familyCount"),
  acronymCount: document.querySelector("#acronymCount"),
  copyFilteredButton: document.querySelector("#copyFilteredButton"),
  exportOneNoteButton: document.querySelector("#exportOneNoteButton"),
  exportWordButton: document.querySelector("#exportWordButton"),
  toast: document.querySelector("#toast"),
};

const sourceFile = "oracle_apps_portfolio_es.md";

init();

async function init() {
  bindEvents();

  if (Array.isArray(window.PORTFOLIO_DATA)) {
    state.products = window.PORTFOLIO_DATA;
    render();
    return;
  }

  try {
    const markdown = await fetch(sourceFile).then((response) => {
      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo fuente.");
      }
      return response.text();
    });
    state.products = parsePortfolio(markdown);
    render();
  } catch (error) {
    elements.resultTitle.textContent = "No se pudo cargar el portfolio";
    elements.resultMeta.textContent = "Abre la app desde el servidor local para que pueda leer el archivo Markdown.";
    showToast("No se pudo cargar el archivo fuente");
  }
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });

  elements.clearFiltersButton.addEventListener("click", () => {
    state.activeFamily = "Todos";
    state.query = "";
    elements.searchInput.value = "";
    render();
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === button));
      render();
    });
  });

  elements.copyFilteredButton.addEventListener("click", () => {
    copyText(formatForCopy(getFilteredProducts()), "Resultados copiados");
  });

  elements.exportOneNoteButton.addEventListener("click", () => {
    exportToOneNote(getFilteredProducts());
  });

  elements.exportWordButton.addEventListener("click", () => {
    exportToWord(getFilteredProducts());
  });
}

function parsePortfolio(markdown) {
  const rows = [];
  let section = "";

  markdown.split(/\r?\n/).forEach((line) => {
    if (line.startsWith("## ")) {
      section = line.replace("## ", "").trim();
      return;
    }

    if (!line.startsWith("|") || line.includes("|---") || line.includes("| Familia ") || line.includes("| Industria ")) {
      return;
    }

    const cells = splitMarkdownRow(line);
    if (cells.length < 6) {
      return;
    }

    const [family, product, acronym, meaning, description, linkCell] = cells;
    if (!family || !product || product === "Producto / subsolucion") {
      return;
    }

    rows.push({
      section,
      family,
      product,
      acronym: cleanDash(acronym),
      meaning: cleanDash(meaning),
      description,
      linkText: extractLinkText(linkCell),
      link: extractUrl(linkCell),
    });
  });

  return rows;
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function cleanDash(value) {
  return value === "-" ? "" : value;
}

function extractUrl(markdownLink) {
  const match = markdownLink.match(/\((https?:\/\/[^)]+)\)/);
  return match ? match[1] : markdownLink;
}

function extractLinkText(markdownLink) {
  const match = markdownLink.match(/\[([^\]]+)\]/);
  return match ? match[1] : "Link";
}

function getFilteredProducts() {
  return state.products.filter((item) => {
    const matchesFamily = state.activeFamily === "Todos" || item.family === state.activeFamily;
    const haystack = [item.section, item.family, item.product, item.acronym, item.meaning, item.description].join(" ").toLowerCase();
    const matchesQuery = !state.query || haystack.includes(state.query);
    return matchesFamily && matchesQuery;
  });
}

function render() {
  const filtered = getFilteredProducts();

  renderSummary(filtered);
  renderFilters();
  renderCards(filtered);
  renderTable(filtered);

  const hasResults = filtered.length > 0;
  elements.cardsView.classList.toggle("hidden", state.view !== "cards" || !hasResults);
  elements.tableView.classList.toggle("hidden", state.view !== "table" || !hasResults);
  elements.emptyState.classList.toggle("hidden", hasResults);

  elements.resultTitle.textContent = state.activeFamily === "Todos" ? "Todos los productos" : state.activeFamily;
  elements.resultMeta.textContent = `${filtered.length} resultado${filtered.length === 1 ? "" : "s"} visibles`;
}

function renderSummary(filtered) {
  const uniqueFamilies = new Set(filtered.map((item) => item.family));
  const withAcronyms = filtered.filter((item) => item.acronym).length;

  elements.productCount.textContent = filtered.length;
  elements.familyCount.textContent = uniqueFamilies.size;
  elements.acronymCount.textContent = withAcronyms;
}

function renderFilters() {
  const counts = state.products.reduce((map, item) => {
    map.set(item.family, (map.get(item.family) || 0) + 1);
    return map;
  }, new Map());

  const families = ["Todos", ...Array.from(counts.keys()).sort((a, b) => a.localeCompare(b, "es"))];

  elements.familyFilters.innerHTML = families
    .map((family) => {
      const count = family === "Todos" ? state.products.length : counts.get(family);
      const active = family === state.activeFamily ? " active" : "";
      return `<button class="filter-option${active}" type="button" data-family="${escapeAttribute(family)}">
        <span>${escapeHtml(family)}</span>
        <span class="filter-count">${count}</span>
      </button>`;
    })
    .join("");

  elements.familyFilters.querySelectorAll("[data-family]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFamily = button.dataset.family;
      render();
    });
  });
}

function renderCards(products) {
  elements.cardsView.innerHTML = products.map(createCard).join("");

  elements.cardsView.querySelectorAll("[data-copy-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = products.find((item) => item.product === button.dataset.copyProduct);
      copyText(formatProduct(product), "Ficha copiada");
    });
  });
}

function createCard(item) {
  const acronym = item.acronym
    ? `<div class="acronym-line"><strong>${escapeHtml(item.acronym)}</strong>${item.meaning ? ` &middot; ${escapeHtml(item.meaning)}` : ""}</div>`
    : `<div class="acronym-line">Sin siglas especificas</div>`;

  return `<article class="product-card">
    <div class="product-topline">
      <span class="family-tag" title="${escapeAttribute(item.family)}">${escapeHtml(item.family)}</span>
      <span class="section-tag">${escapeHtml(item.section)}</span>
    </div>
    <h3>${escapeHtml(item.product)}</h3>
    ${acronym}
    <p class="product-description">${escapeHtml(item.description)}</p>
    <div class="card-actions">
      <a class="text-button primary-link" href="${escapeAttribute(item.link)}" target="_blank" rel="noreferrer">Abrir link</a>
      <button class="text-button secondary-button" type="button" data-copy-product="${escapeAttribute(item.product)}">Copiar</button>
    </div>
  </article>`;
}

function renderTable(products) {
  elements.tableBody.innerHTML = products
    .map((item) => `<tr>
      <td><strong>${escapeHtml(item.product)}</strong></td>
      <td>${escapeHtml(item.family)}<br><span class="acronym-line">${escapeHtml(item.section)}</span></td>
      <td>${item.acronym ? `<strong>${escapeHtml(item.acronym)}</strong><br>${escapeHtml(item.meaning)}` : "-"}</td>
      <td>${escapeHtml(item.description)}</td>
      <td><a href="${escapeAttribute(item.link)}" target="_blank" rel="noreferrer">${escapeHtml(item.linkText)}</a></td>
    </tr>`)
    .join("");
}

function formatProduct(item) {
  if (!item) {
    return "";
  }

  const acronym = item.acronym ? ` (${item.acronym}${item.meaning ? `: ${item.meaning}` : ""})` : "";
  return `${item.product}${acronym}\nFamilia: ${item.family}\nDescripcion: ${item.description}\nLink: ${item.link}`;
}

function formatForCopy(products) {
  return products.map(formatProduct).join("\n\n");
}

async function exportToOneNote(products) {
  if (!products.length) {
    showToast("No hay resultados para exportar");
    return;
  }

  const html = formatHtmlDocument(products, false);
  const text = formatGroupedText(products);

  try {
    if (window.ClipboardItem && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
    } else {
      await copyTextToClipboard(text);
    }
    showToast("Copiado para pegar en OneNote");
  } catch {
    const copied = copyTextWithSelection(text);
    showToast(copied ? "Copiado para pegar en OneNote" : "No se pudo copiar");
  }
}

function exportToWord(products) {
  if (!products.length) {
    showToast("No hay resultados para exportar");
    return;
  }

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Portfolio de Oracle Apps</title>
  </head>
  <body>${formatHtmlDocument(products, true)}</body>
</html>`;
  downloadFile("oracle-apps-portfolio.doc", html, "application/msword;charset=utf-8");
  showToast("Documento Word descargado");
}

function formatGroupedText(products) {
  const lines = ["Portfolio de Oracle Apps", ""];
  let currentSection = "";
  let currentFamily = "";

  products.forEach((item) => {
    if (item.section !== currentSection) {
      currentSection = item.section;
      currentFamily = "";
      lines.push(currentSection.toUpperCase(), "");
    }

    if (item.family !== currentFamily) {
      currentFamily = item.family;
      lines.push(currentFamily);
    }

    const acronym = item.acronym ? ` (${item.acronym}${item.meaning ? `: ${item.meaning}` : ""})` : "";
    lines.push(`- ${item.product}${acronym}: ${item.description}`);
    lines.push(`  Link: ${item.link}`);
  });

  return lines.join("\n");
}

function formatHtmlDocument(products, includeStyles) {
  const groups = groupProducts(products);
  const style = includeStyles
    ? `<style>
      body { font-family: Arial, sans-serif; color: #1f2933; }
      h1 { color: #222f3a; }
      h2 { border-bottom: 1px solid #d8ddd8; color: #9d2f23; padding-bottom: 4px; }
      h3 { color: #243a4a; margin-bottom: 6px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #d8ddd8; padding: 8px; vertical-align: top; }
      th { background: #eef1f2; }
      a { color: #9d2f23; }
    </style>`
    : "";
  const sections = Array.from(groups.entries())
    .map(([section, families]) => `<h2>${escapeHtml(section)}</h2>${Array.from(families.entries())
      .map(([family, items]) => `<h3>${escapeHtml(family)}</h3>${formatHtmlTable(items)}`)
      .join("")}`)
    .join("");

  return `${style}<h1>Portfolio de Oracle Apps</h1><p>${products.length} productos exportados.</p>${sections}`;
}

function formatHtmlTable(products) {
  return `<table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>Siglas</th>
        <th>Descripcion</th>
        <th>Link</th>
      </tr>
    </thead>
    <tbody>
      ${products.map((item) => `<tr>
        <td><strong>${escapeHtml(item.product)}</strong></td>
        <td>${item.acronym ? `<strong>${escapeHtml(item.acronym)}</strong><br>${escapeHtml(item.meaning)}` : "-"}</td>
        <td>${escapeHtml(item.description)}</td>
        <td><a href="${escapeAttribute(item.link)}">${escapeHtml(item.linkText)}</a></td>
      </tr>`).join("")}
    </tbody>
  </table>`;
}

function groupProducts(products) {
  return products.reduce((sections, item) => {
    if (!sections.has(item.section)) {
      sections.set(item.section, new Map());
    }
    const families = sections.get(item.section);
    if (!families.has(item.family)) {
      families.set(item.family, []);
    }
    families.get(item.family).push(item);
    return sections;
  }, new Map());
}

function downloadFile(fileName, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text, message) {
  try {
    await copyTextToClipboard(text);
    showToast(message);
  } catch {
    const copied = copyTextWithSelection(text);
    showToast(copied ? message : "No se pudo copiar");
  }
}

function copyTextToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

function copyTextWithSelection(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  textArea.remove();
  return copied;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 1800);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
