const { ipcRenderer, shell } = require("electron");

// Helper Methods
const validate = (target) => {
  if (target.hasAttribute("required")) {
    if (target.value === "") {
      return false;
    }
  }
  return true;
};

const footer_message = (success, message) => {
  let el = document.getElementById("error-box");
  let classList = el.classList;
  if (classList.contains("d-invisible")) {
    classList.remove("d-invisible");
  }
  if (success) {
    classList.add("text-success");
  } else {
    classList.add("text-error");
  }
  el.innerText = message;
};

const clear_footer_message = () => {
  let el = document.getElementById("error-box");
  let classList = el.classList;
  classList.add("d-invisible");
};

const set_loading = (enable) => {
  const loading_div = document.getElementById("loading");
  const form = document.getElementById("exportform");
  const classList = loading_div.classList;
  const fieldset = document.getElementById("exportform-fieldset");

  if (enable) {
    if (classList.contains("d-invisible")) {
      classList.remove("d-invisible");
    }
    fieldset.setAttribute("disabled", "");
  } else {
    classList.add("d-invisible");
    fieldset.removeAttribute("disabled");
  }
};

// Html Event Handlers
document.getElementById("exportform").addEventListener("submit", (evt) => {
  evt.preventDefault();
  clear_footer_message();
  let invalid = false;
  for (let tgt of evt.target) {
    if (!validate(tgt)) {
      invalid = true;
    }
  }

  if (!invalid) {
    ipcRenderer.send("submit-export", {
      token: evt.target[1].value,
      search: evt.target[2].value,
      format: evt.target[3].value,
      dateFormat: evt.target[4].value,
      owner: evt.target[5].value,
      search: evt.target[6].value,
      baseUrl: evt.target[7].value,
      repo: evt.target[8].value,
      // export button is evt.target[9]
      
    });
  } else {
    console.log("Invalid not submitting");
  }
});

document.getElementById("owner-input").addEventListener("change", (event) => {
  event.preventDefault();
  console.log(event);
  const owner = event.target;
  let classList = owner.classList;
  if (owner.value) {
    if (classList.contains("is-error")) {
      classList.remove("is-error");
    }
  } else {
    classList.add("is-error");
  }
});

document.getElementById("search-help").addEventListener("click", (evt) => {
  evt.preventDefault();
  console.log(evt.target.getAttribute("href"));
  shell.openExternal(evt.target.getAttribute("href"));
});
// Electron Event Handlers
ipcRenderer.on("export-success", (evt, msg) => {
  console.log(`Event Received: ${msg} ${evt}`);
  footer_message(true, msg);
});

ipcRenderer.on("export-error", (evt, msg) => {
  console.log(`Event Received: ${msg} ${evt}`);
  footer_message(false, msg);
});

ipcRenderer.on("export-loading-start", (evt) => {
  console.log(`Event Received: ${evt}`);
  set_loading(true);
});

ipcRenderer.on("export-loading-stop", (evt) => {
  console.log(`Event Received: ${evt}`);
  set_loading(false);
});
