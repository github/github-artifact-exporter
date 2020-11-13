// eslint-disable-next-line @typescript-eslint/no-var-requires
export const { app, BrowserWindow } = require("electron");

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Window {
  const defaultProps = {
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  };

  export class MainWindow extends BrowserWindow {
    constructor(file: string, { ...windowSettings }) {
      super({ ...defaultProps, ...windowSettings });
      this.loadFile(file);
      //this.webContents.openDevTools();

      this.once("ready-to-show", () => {
        this.show();
      });
    }
  }
}
