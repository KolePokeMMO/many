---
hide:
  - title
---

<div id="oracle-admin">
  <div class="admin-pane left">
    <h2>📂 Data Files</h2>
    <ul id="json-list"></ul>
  </div>

  <div class="admin-pane right">
    <div id="json-header">
      <h2 id="file-title">Select a file...</h2>
      <button id="download-json" class="hidden">Download JSON</button>
    </div>
    <div id="entry-list-container">
      <button id="add-entry-btn" class="hidden">+ Add New Entry</button>
      <div id="entry-list"></div>
    </div>
  </div>
</div>

<!-- Modal for add/edit -->
<div id="modal-overlay" class="hidden">
  <div id="modal-box">
    <h3 id="modal-title">Edit Entry</h3>
    <form id="modal-form"></form>
    <div class="modal-actions">
      <button type="button" id="modal-save">Save</button>
      <button type="button" id="modal-cancel">Cancel</button>
    </div>
  </div>
</div>

<link rel="stylesheet" href="/many/assets/css/oracle/admin.css">
<script defer src="/many/assets/js/oracle/admin.js"></script>