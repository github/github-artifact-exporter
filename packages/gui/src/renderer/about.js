const { ipcRenderer, shell, remote } = require("electron");

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("version").innerHTML = `Version: v${remote.getCurrentWindow().guiVersion}`;
})

document.getElementById("open-source").addEventListener("click", (evt) => {
    ipcRenderer.send("open-os")
})