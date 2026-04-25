const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lilguyz", {
  notifyJared(payload) {
    ipcRenderer.send("jared-notification", {
      title: typeof payload?.title === "string" ? payload.title : "Jared reminder",
      body: typeof payload?.body === "string" ? payload.body : "",
    });
  },

  onSystemResume(callback) {
    if (typeof callback !== "function") return () => {};

    const listener = () => callback();
    ipcRenderer.on("system-resume", listener);
    return () => ipcRenderer.removeListener("system-resume", listener);
  },
});
