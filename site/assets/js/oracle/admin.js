(() => {
  // Globals
  let jsonFiles = [];
  let currentJsonFile = null;
  let currentJsonData = null;

  // DOM refs
  const jsonListEl = document.getElementById("json-list");
  const fileTitleEl = document.getElementById("file-title");
  const downloadBtn = document.getElementById("download-json");
  const entryListEl = document.getElementById("entry-list");
  const addEntryBtn = document.getElementById("add-entry-btn");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalBox = document.getElementById("modal-box");
  const modalForm = document.getElementById("modal-form");
  const modalTitle = document.getElementById("modal-title");
  const modalSaveBtn = document.getElementById("modal-save");
  const modalCancelBtn = document.getElementById("modal-cancel");

  // Helpers
  function normalizeFilename(filename) {
    return filename.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  // Fetch list of JSON files from /many/assets/data/oracle/
  async function loadJsonFileList() {
    jsonFiles = [
      "fallback.json",
      "idle.json",
      "smug.json",
      "sad.json",
      "shocked.json",
      "bored.json",
      "mischievous.json",
      "happy.json",
      "angry.json",
      "confused.json",
    ];
    renderJsonFileList();
  }

  // Render left pane JSON file list
  function renderJsonFileList() {
    jsonListEl.innerHTML = "";
    jsonFiles.forEach((file) => {
      const li = document.createElement("li");
      li.textContent = file;
      li.dataset.filename = file;
      li.tabIndex = 0;
      li.classList.toggle("selected", currentJsonFile === file);
      li.addEventListener("click", () => selectJsonFile(file));
      li.addEventListener("keypress", (e) => {
        if (e.key === "Enter") selectJsonFile(file);
      });
      jsonListEl.appendChild(li);
    });
  }

  // Select and load a JSON file
  async function selectJsonFile(filename) {
    if (currentJsonFile === filename) return;

    try {
      const res = await fetch(`/many/assets/data/oracle/${filename}`);
      if (!res.ok) throw new Error("Failed to fetch JSON");
      const data = await res.json();

      currentJsonFile = filename;
      currentJsonData = data;

      fileTitleEl.textContent = filename;
      downloadBtn.classList.remove("hidden");
      addEntryBtn.classList.remove("hidden");

      renderEntryList();

      renderJsonFileList();
    } catch (err) {
      alert("Error loading JSON file: " + err.message);
    }
  }

function renderEntryList() {
  entryListEl.innerHTML = "";

  if (!Array.isArray(currentJsonData)) {
    entryListEl.innerHTML = `<p style="color:#aaa;">Expected an array of entries in JSON.</p>`;
    return;
  }

  currentJsonData.forEach((entry, idx) => {
    const card = document.createElement("div");
    card.className = "entry-card";

    const summary = document.createElement("div");
    summary.className = "entry-summary";

    // Check if fallback entry
    const isFallback = entry.fallback === true;

    // Label: fallback or keywords or preview
    let label = "";
    if (isFallback) {
      label = "🔮 Fallback Entry";
      card.classList.add("fallback-card"); // optional: add a CSS class
    } else if (entry.original) {
      label = entry.original;
    } else if (Array.isArray(entry.keywords)) {
      label = entry.keywords.join(", ");
    } else {
      label = JSON.stringify(entry).slice(0, 30) + "...";
    }

    summary.textContent = label;

    const actions = document.createElement("div");
    actions.className = "entry-actions";

    // Edit button (allowed for all)
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openModal("edit", idx));
    actions.appendChild(editBtn);

    // Delete button (optional: prevent deleting fallback)
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.disabled = isFallback; // prevent deletion if fallback
    deleteBtn.title = isFallback ? "Fallback entry can't be deleted" : "Delete this entry";
    deleteBtn.addEventListener("click", () => {
      if (!isFallback && confirm(`Are you sure you want to delete entry #${idx + 1}?`)) {
        currentJsonData.splice(idx, 1);
        renderEntryList();
      }
    });
    actions.appendChild(deleteBtn);

    card.appendChild(summary);
    card.appendChild(actions);
    entryListEl.appendChild(card);
  });
}


  // Open modal for add or edit
function openModal(mode, index = null) {
  modalForm.innerHTML = "";
  modalOverlay.classList.remove("hidden");

  let entry = null;
  if (mode === "edit") {
    modalTitle.textContent = `Edit Entry #${index + 1}`;
    entry = currentJsonData[index];
  } else if (mode === "add") {
    modalTitle.textContent = "Add New Entry";
    entry = {};
  }

  // Get keys for form generation
  const keys = new Set();
  if (entry) {
    Object.keys(entry).forEach(k => keys.add(k));
  }
  // Provide defaults if empty
  if (keys.size === 0) {
    ["original", "response", "mood", "keywords", "extra"].forEach(k => keys.add(k));
  }

  keys.forEach(key => {
    if (key === "mood") {
      // Mood dropdown
      const label = document.createElement("label");
      label.textContent = "Mood";
      label.htmlFor = "field-mood";
      modalForm.appendChild(label);

      const select = document.createElement("select");
      select.id = "field-mood";
      select.name = "mood";

      const moods = [
        "happy", "angry", "confused", "smug", "sad",
        "shocked", "bored", "mischievous", "idle"
      ];

      moods.forEach(mood => {
        const option = document.createElement("option");
        option.value = mood;
        option.textContent = mood.charAt(0).toUpperCase() + mood.slice(1);
        if (entry.mood === mood) option.selected = true;
        select.appendChild(option);
      });

      modalForm.appendChild(select);

    } else if (key === "keywords") {
      // Keywords textarea
      const label = document.createElement("label");
      label.textContent = "Keywords (comma separated)";
      label.htmlFor = "field-keywords";
      modalForm.appendChild(label);

      const textarea = document.createElement("textarea");
      textarea.id = "field-keywords";
      textarea.name = "keywords";
      textarea.rows = 2;
      textarea.placeholder = "e.g. shiny, rare, sparkly";
      textarea.value = Array.isArray(entry.keywords) ? entry.keywords.join(", ") : "";
      modalForm.appendChild(textarea);

    } else if (key === "extra") {
      // Replace old raw JSON textarea for extra with 3 fields:
      // header, body, footer

      const extra = entry.extra || {};

      // Extra Header
      const headerLabel = document.createElement("label");
      headerLabel.textContent = "Extra Header";
      headerLabel.htmlFor = "field-extra-header";
      modalForm.appendChild(headerLabel);

      const headerInput = document.createElement("input");
      headerInput.type = "text";
      headerInput.id = "field-extra-header";
      headerInput.name = "extra-header";
      headerInput.value = extra.header || "";
      modalForm.appendChild(headerInput);

      // Extra Body (textarea)
      const bodyLabel = document.createElement("label");
      bodyLabel.textContent = "Extra Body";
      bodyLabel.htmlFor = "field-extra-body";
      modalForm.appendChild(bodyLabel);

      const bodyTextarea = document.createElement("textarea");
      bodyTextarea.id = "field-extra-body";
      bodyTextarea.name = "extra-body";
      bodyTextarea.rows = 4;
      bodyTextarea.value = extra.body || "";
      modalForm.appendChild(bodyTextarea);

      // Extra Footer
      const footerLabel = document.createElement("label");
      footerLabel.textContent = "Extra Footer";
      footerLabel.htmlFor = "field-extra-footer";
      modalForm.appendChild(footerLabel);

      const footerInput = document.createElement("input");
      footerInput.type = "text";
      footerInput.id = "field-extra-footer";
      footerInput.name = "extra-footer";
      footerInput.value = extra.footer || "";
      modalForm.appendChild(footerInput);

    } else {
      // Default text input or textarea for 'response' (use textarea), or input for others

      const label = document.createElement("label");
      label.textContent = key.charAt(0).toUpperCase() + key.slice(1);
      label.htmlFor = `field-${key}`;
      modalForm.appendChild(label);

      let input;
      if (key === "response") {
        input = document.createElement("textarea");
        input.rows = 4;
      } else {
        input = document.createElement("input");
        input.type = "text";
      }
      input.id = `field-${key}`;
      input.name = key;
      input.value = entry[key] || "";
      modalForm.appendChild(input);
    }
  });

  // Save button handler
  modalSaveBtn.onclick = () => {
    const formData = new FormData(modalForm);
    const newEntry = {};

    for (const [k, v] of formData.entries()) {
      if (k === "keywords") {
        newEntry[k] = v.split(",").map(s => s.trim()).filter(Boolean);
      } else if (k.startsWith("extra-")) {
        // We'll collect these into extra later
        if (!newEntry.extra) newEntry.extra = {};
        const extraKey = k.replace("extra-", "");
        newEntry.extra[extraKey] = v;
      } else {
        newEntry[k] = v;
      }
    }

    // Clean up extra if all fields are empty
    if (newEntry.extra) {
      const allEmpty = Object.values(newEntry.extra).every(val => !val.trim());
      if (allEmpty) {
        delete newEntry.extra;
      }
    }

    if (mode === "edit") {
      currentJsonData[index] = newEntry;
    } else if (mode === "add") {
      currentJsonData.push(newEntry);
    }

    closeModal();
    renderEntryList();
  };

  modalCancelBtn.onclick = closeModal;
}


  function closeModal() {
    modalOverlay.classList.add("hidden");
  }

  // Download current JSON file
  function downloadJsonFile() {
    if (!currentJsonData || !currentJsonFile) return;

    const blob = new Blob([JSON.stringify(currentJsonData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = currentJsonFile;
    a.click();

    URL.revokeObjectURL(url);
  }

  // Event listeners
  addEntryBtn.addEventListener("click", () => openModal("add"));

  downloadBtn.addEventListener("click", downloadJsonFile);

  // Init
  loadJsonFileList();
})();

// Force hide modal on load
modalOverlay.classList.add("hidden");