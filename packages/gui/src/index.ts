import { Window } from "./window";
import * as jsonexport from "jsonexport";
import * as dot from "dot-object";
import {
  Issue,
  IssueComment,
  getIssues,
  getComments,
  User,
  getIssuesWithComments,
  iterateObject,
} from "@github/github-artifact-exporter-core";
import { retry } from "@octokit/plugin-retry";
import { Octokit } from "@octokit/rest";
import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  app as appMain,
  BrowserWindow as BrowserWindowMain,
  remote,
  shell,
} from "electron";
import * as ESAPI from "node-esapi";

//import openAboutWindow from "about-window";
import * as fs from "fs";
import * as path from "path";
import * as winston from "winston";
import * as showdown from "showdown";
import dateformat = require("dateformat");

const encoder = ESAPI.encoder();
const MyOctokit = Octokit.plugin(retry);

const githubIcon = `${__dirname}/renderer/GitHub-Mark-120px-plus.png`;
const logger = setupLoggers();

const indexPath = getFilePath("./lib/renderer/index.html");

function isPackaged() {
  return (
    app.getAppPath().includes(".app") || app.getAppPath().includes("app.asar")
  );
}

function isWindows() {
  return (
    app.getAppPath().includes("app.asar") && !app.getAppPath().includes(".app")
  );
}

function setupLoggers(): winston.Logger {
  if (isPackaged()) {
    const prefix = buildPrefix();
    let logPath = getFilePath("../../../github-artifact-exporter.log");
    if (isWindows()) {
      logPath = getFilePath("../github-artifact-exporter.log");
    }

    return winston.createLogger({
      level: "info",
      format: winston.format.json(),
      defaultMeta: { service: "user-service" },
      transports: [new winston.transports.File({ filename: logPath })],
    });
  } else {
    return winston.createLogger({
      level: "info",
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });
  }
}

function buildPrefix() {
  const lastIndex = app.getAppPath().lastIndexOf("app.asar");
  const str = app.getAppPath().substring(0, lastIndex);
  return `${str}/`;
}

function getFilePath(relativePath: string) {
  if (isPackaged()) {
    const prefix = buildPrefix();
    return `${prefix}${relativePath}`;
  }

  return relativePath;
}

const isMac = process.platform === "darwin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const template: any = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: "hide" },
            { role: "hideothers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        },
      ]
    : []),
  {
    label: "File",
    submenu: [isMac ? { role: "close" } : { role: "quit" }],
  },
  {
    label: "Help",
    submenu: [
      {
        label: "About",
        click() {
          openAboutWindow();
        },
      },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
      {
        label: "Select All",
        accelerator: "CmdOrCtrl+A",
        selector: "selectAll:",
      },
    ],
  },
];

function openWindow(options: any, htmlFile: string) {
  let window: any = new BrowserWindow(options);

  window.once("closed", () => {
    window = null;
  });

  //window.webContents.openDevTools();
  window.guiVersion = process.env.npm_package_version;
  window.loadFile(htmlFile);

  window.webContents.on("will-navigate", (e: any, url: any) => {
    e.preventDefault();
    shell.openExternal(url);
  });
  window.webContents.on("new-window", (e: any, url: any) => {
    e.preventDefault();
    shell.openExternal(url);
  });

  window.webContents.once("dom-ready", () => {
    const winTitle = options.title;
    const info: any = { winOptions: null };
    info.winOptions = { title: winTitle };
    info.openDevTools = options.open_devtools;
    window.webContents.send("about-window:info", info);
    if (info.openDevTools) {
      if (process.versions.electron >= "1.4") {
        window.webContents.openDevTools({ mode: "detach" });
      } else {
        window.webContents.openDevTools();
      }
    }
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  window.setMenu(null);

  //info = injectInfoFromPackageJson(info);

  return window;
}

function openAboutWindow() {
  const indexHtml = getFilePath("./lib/renderer/about.html");
  const options = Object.assign(
    {
      width: 400,
      height: 400,
      useContentSize: true,
      titleBarStyle: "hidden-inset",
      // eslint-disable-next-line @typescript-eslint/camelcase
      open_devtools: false,
      webPreferences: {
        // For security reasons, nodeIntegration is no longer true by default when using Electron v5 or later
        // nodeIntegration can be safely enabled as long as the window source is not remote
        nodeIntegration: true,
        // From Electron v10, this option is set to false by default
        enableRemoteModule: true,
      },
    },
    {}
  );

  openWindow(options, indexHtml);
}

// Convert license to html
const license = fs.readFileSync(getFilePath("./lib/renderer/LICENSE"), "utf8");
const converter = new showdown.Converter();
const html = converter.makeHtml(license);
const header = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=yes">
      <title>Open Source License</title>
      <link rel="stylesheet" href="./spectre.min.css" />
      <link rel="stylesheet" href="./open-source.css" />
    </head>
    <body>
    `;
const footer = `
  <!-- https://github.com/electron/electron/issues/2863 -->
  <script>var exports = exports || {};</script>
  <script src="./open-source.js"></script>

  </body>
  </html>`;
fs.writeFileSync(
  getFilePath("lib/renderer/license.html"),
  header + html + footer
);

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
logger.info("Starting Application");

let mainWindow: Window.MainWindow;

const main = () => {
  mainWindow = new Window.MainWindow(indexPath, {});
};

app.on("ready", main);
app.on("window-all-closed", () => {
  if (isMac) {
    app.quit();
  }
});
app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    main();
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
ipcMain.on("submit-export", async (event: any, form: any) => {
  logger.info("Export Event Received");
  const file = await dialog.showSaveDialog({});

  if (!file.canceled) {
    if (!file.filePath) {
      logger.error("Filepath is required.");
      throw new Error("Filepath is required.");
    }
    logger.info(`Filepath requested: ${file.filePath}`);
    try {
      mainWindow.webContents.send("export-loading-start");

      let format = "";
      let jira = false;
      if (form.format.includes("jira")) {
        format = "CSV";
        jira = true;
      } else {
        format = form.format;
      }

      // fix filename
      if (!path.extname(file.filePath)) {
        file.filePath += `.${form.format.toLowerCase()}`;
      }
      logger.info(`Form received: ${JSON.stringify(form)}`);
      const client = new MyOctokit({
        auth: `token ${form.token}`,
        baseUrl: form.baseUrl,
        request: {
          retries: 3,
        },
      });

      let searchQuery = [`is:issue`, `repo:${form.owner}/${form.repo}`];
      searchQuery = searchQuery.concat(form.search.split(" "));

      let issues: Issue[];

      const progressCallback = () => {
        /* TODO Implement callback to show progress to user */
      };

      try {
        issues = await getIssues(
          client,
          searchQuery.join(" "),
          progressCallback
        );
      } catch (error) {
        mainWindow.webContents.send("export-loading-stop");
        mainWindow.webContents.send(
          "export-error",
          `Error when searching issues: ${encoder.encodeForHTML(error)}`
        );
        logger.error(error);
        return;
      }

      if (issues.length < 1) {
        mainWindow.webContents.send("export-loading-stop");
        mainWindow.webContents.send(
          "export-error",
          `No issues found with current search terms`
        );
        logger.error(`No issues found with current search terms`);
        return;
      }

      const issuesWithComments = getIssuesWithComments(issues);

      if (issuesWithComments.length > 0) {
        getComments(client, issuesWithComments, progressCallback);
      }

      const jiraFormatComments = (issue: Issue): void => {
        let i;
        for (i = 0; i < (issue.comments.nodes as IssueComment[]).length; i++) {
          const comment = (issue.comments.nodes as IssueComment[])[i];
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          issue[`comment${i}`] = [
            comment.createdAt,
            (comment.author as User).login,
            comment.body,
          ].join(";");
        }
      };

      for (const issue of issues) {
        if (jira) {
          // We have to do surgery on the Issue object
          jiraFormatComments(issue);
          dot.del("comments.nodes", issue);
        } else {
          dot.move("comments.nodes", "comments", issue);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        iterateObject(issue, (obj: any, prop: any) => {
          if (["createdAt", "updatedAt", "closedAt"].indexOf(prop) > -1) {
            obj[prop] = dateformat(obj[prop], form.dateFormat);
          }
        });

        dot.del("id", issue);
        dot.move("assignees.nodes", "assignees", issue);
        dot.move("labels.nodes", "labels", issue);

        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        issue.labels = issue.labels.map(({ name }) => name).join(", ");
      }

      if (format === "JSONL") {
        const stream = fs.createWriteStream(file.filePath);
        for (const issue of issues) {
          stream.write(`${JSON.stringify(issue)}\n`);
        }
        stream.end();
      } else if (format === "JSON") {
        fs.writeFileSync(file.filePath, JSON.stringify(issues));
      } else if (format === "CSV") {
        let mapHeaders: Function | null = null;

        if (jira) {
          // Jira expects all comments to have a header of just "comment"
          // so we map commment0, comment1, comment2 etc to comment
          mapHeaders = function (subHeader: string) {
            return subHeader.replace(/comment[0-9]+/, "comment");
          };
        }

        const csv = await jsonexport(issues, { fillGaps: true, mapHeaders });
        fs.writeFileSync(file.filePath, csv);
      }

      mainWindow.webContents.send("export-loading-stop");
      mainWindow.webContents.send(
        "export-success",
        `Export complete.  Results written to ${file.filePath}`
      );
    } catch (error) {
      mainWindow.webContents.send("export-loading-stop");
      mainWindow.webContents.send(
        "export-failure",
        `Export failure: ${encoder.encodeForHTML(error)}`
      );
      logger.error(error);
    }
  }
});

ipcMain.on("open-os", () => {
  const info = {
    openDevtools: false,
    adjustWindowSize: false,
    winOptions: {
      title: "Open Source License",
    },
  };
  const indexHtml = getFilePath("lib/renderer/license.html");

  const options = Object.assign(
    {
      width: 600,
      height: 600,
      useContentSize: true,
      titleBarStyle: "hidden-inset",
      show: !info.adjustWindowSize,
      title: info.winOptions.title,
      // eslint-disable-next-line @typescript-eslint/camelcase
      open_devtools: info.openDevtools,
      webPreferences: {
        // For security reasons, nodeIntegration is no longer true by default when using Electron v5 or later
        // nodeIntegration can be safely enabled as long as the window source is not remote
        nodeIntegration: true,
        // From Electron v10, this option is set to false by default
        enableRemoteModule: true,
      },
    },
    info.winOptions || {}
  );

  const window = openWindow(options, indexHtml);
});
